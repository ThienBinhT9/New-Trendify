"""
NetworkX graph builder service.
Builds a directed social graph from the MongoDB follows collection.
Cached and rebuilt periodically.
"""

import networkx as nx
from bson import ObjectId
from app.services.mongo_service import MongoService
from app.services.redis_service import RedisService


class GraphService:
    """Builds and maintains a NetworkX DiGraph from the social follow graph."""

    _instance: "GraphService | None" = None
    _graph: nx.DiGraph | None = None

    @classmethod
    def get_instance(cls) -> "GraphService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def graph(self) -> nx.DiGraph:
        if self._graph is None:
            raise RuntimeError("Graph not built yet. Call build_graph() first.")
        return self._graph

    @property
    def is_built(self) -> bool:
        return self._graph is not None

    async def build_graph(self, force: bool = False) -> nx.DiGraph:
        """
        Build the social graph from MongoDB follows collection.
        Only rebuilds if graph doesn't exist or force=True.
        """
        if self._graph is not None and not force:
            return self._graph

        mongo = MongoService.get_instance()
        print("🔄 Building social graph from follows collection...")

        G = nx.DiGraph()

        # Fetch all ACCEPTED follows
        cursor = mongo.follows.find(
            {"status": "ACCEPTED"},
            {"followerId": 1, "followingId": 1},
        )

        edge_count = 0
        async for doc in cursor:
            follower_id = str(doc["followerId"])
            following_id = str(doc["followingId"])
            G.add_edge(follower_id, following_id)
            edge_count += 1

        self._graph = G
        print(
            f"✅ Social graph built: {G.number_of_nodes()} nodes, "
            f"{edge_count} edges"
        )
        return G

    def get_following(self, user_id: str) -> set[str]:
        """Get all user IDs that this user follows."""
        if not self.is_built or not self.graph.has_node(user_id):
            return set()
        return set(self.graph.successors(user_id))

    def get_followers(self, user_id: str) -> set[str]:
        """Get all user IDs that follow this user."""
        if not self.is_built or not self.graph.has_node(user_id):
            return set()
        return set(self.graph.predecessors(user_id))

    def get_friends_of_friends(
        self, user_id: str, limit: int = 200
    ) -> dict[str, list[str]]:
        """
        Get 2-hop neighbors (friends of friends) who user doesn't follow yet.
        Returns: { candidate_id: [through_user_1, through_user_2, ...] }
        """
        if not self.is_built or not self.graph.has_node(user_id):
            return {}

        following = self.get_following(user_id)
        candidates: dict[str, list[str]] = {}

        for friend in following:
            if not self.graph.has_node(friend):
                continue
            for fof in self.graph.successors(friend):
                # Skip self and already-following
                if fof == user_id or fof in following:
                    continue
                if fof not in candidates:
                    candidates[fof] = []
                candidates[fof].append(friend)

        # Sort by mutual count descending, take top N
        sorted_candidates = dict(
            sorted(candidates.items(), key=lambda x: len(x[1]), reverse=True)[
                :limit
            ]
        )
        return sorted_candidates

    def jaccard_coefficient(
        self, user_id: str, candidate_ids: list[str]
    ) -> dict[str, float]:
        """Calculate Jaccard coefficient for unidirected version of graph."""
        if not self.is_built:
            return {}

        G_undir = self.graph.to_undirected()
        results = {}

        if not G_undir.has_node(user_id):
            return {c: 0.0 for c in candidate_ids}

        pairs = [(user_id, c) for c in candidate_ids if G_undir.has_node(c)]
        for u, v, coeff in nx.jaccard_coefficient(G_undir, pairs):
            results[v] = coeff

        # Fill missing candidates
        for c in candidate_ids:
            if c not in results:
                results[c] = 0.0

        return results

    def adamic_adar_index(
        self, user_id: str, candidate_ids: list[str]
    ) -> dict[str, float]:
        """Calculate Adamic-Adar index — weights by inverse log of node degree."""
        if not self.is_built:
            return {}

        G_undir = self.graph.to_undirected()
        results = {}

        if not G_undir.has_node(user_id):
            return {c: 0.0 for c in candidate_ids}

        pairs = [(user_id, c) for c in candidate_ids if G_undir.has_node(c)]
        for u, v, score in nx.adamic_adar_index(G_undir, pairs):
            results[v] = score

        for c in candidate_ids:
            if c not in results:
                results[c] = 0.0

        return results

    def mutual_followers_count(
        self, user_id: str, candidate_ids: list[str]
    ) -> dict[str, int]:
        """Count mutual followers (people both users follow)."""
        if not self.is_built:
            return {}

        user_following = self.get_following(user_id)
        results = {}

        for c in candidate_ids:
            c_following = self.get_following(c)
            results[c] = len(user_following & c_following)

        return results
