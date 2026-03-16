import { createRoot } from "react-dom/client";

import "@/themes/_global.scss";
import Providers from "@/provider/Provider.tsx";

createRoot(document.getElementById("root")!).render(<Providers />);
