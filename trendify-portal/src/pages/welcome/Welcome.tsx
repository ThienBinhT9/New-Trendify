import { Flex } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./Welcome.scss";
import logoIcon from "@/assets/images/icon-logo.png";
import ROUTE_PATHS from "@/routes/path.route";

import Text from "@/components/text/Text";
import Button from "@/components/button/Button";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Welcome to Trendify";

    return () => {
      document.title = "Trendify";
    };
  }, []);

  return (
    <Flex vertical style={{ minHeight: "100dvh" }}>
      <Flex className="welcome-content">
        <Flex vertical align="center" gap={6}>
          <Flex align="center" gap={6}>
            <img src={logoIcon} style={{ width: 42 }} />
            <Text className="welcome__logo typewriter">WELCOME TO TRENDIFY</Text>
          </Flex>
        </Flex>
        <Button
          type="primary"
          size="large"
          className="welcome__start"
          onClick={() => {
            navigate(ROUTE_PATHS.HOME, { replace: true });
          }}
        >
          <Text textType="M14">Let's Start</Text>
        </Button>
      </Flex>
    </Flex>
  );
};

// const StepSecond = () => {
//   const [form] = Form.useForm();

//   return (
//     <Flex className="welcome-content">
//       <Flex className="welcome-content-form" vertical gap={12}>
//         <Text textType="M20">Setup Profile</Text>
//         <Form form={form} layout="vertical">
//           <Form.Item label="Avatar">
//             <Upload>
//               <Avatar size={80} />
//             </Upload>
//           </Form.Item>
//           <Form.Item name="genter" label="Gender">
//             <Input placeholder="Gender" />
//           </Form.Item>
//           <Form.Item name="dateOfBirth" label="Date of birth">
//             <Input placeholder="Date of birth" />
//           </Form.Item>

//           <Form.Item name="home_town" label="Place of birth">
//             <Input placeholder="Place of birth" />
//           </Form.Item>
//           <Flex gap={12} justify="end">
//             <Button className="btn" size="large">
//               <Text textType="M14">Skip</Text>
//             </Button>
//             <Button className="btn" size="large" type="primary" htmlType="submit">
//               <Text textType="M14">Save</Text>
//             </Button>
//           </Flex>
//         </Form>
//       </Flex>
//     </Flex>
//   );
// };

// const StepThird = () => {
//   return (
//     <Flex className="welcome-content">
//       <Flex className="welcome-content-form" vertical gap={12}>
//         <Text textType="M20">People You May Know</Text>
//         <Flex
//           vertical
//           gap={16}
//           style={{ backgroundColor: "#fafafa", padding: 12, borderRadius: 12 }}
//         >
//           {[1, 1, 1].map((item) => (
//             <Flex gap={10} flex={1} align="center" className="welcome-suggest-item" key={item}>
//               <Avatar size={42} />
//               <Flex vertical gap={2} flex={1}>
//                 <Text textType="M14">Tran Thu Uyen</Text>
//                 <Flex align="center">
//                   <Text textType="R12">Sống tại Lang Son</Text>
//                 </Flex>
//               </Flex>
//               <Button type="primary" icon={<UserAddOutlined />}>
//                 <Text textType="M14">Add</Text>
//               </Button>
//             </Flex>
//           ))}
//         </Flex>
//         <Flex gap={12} justify="end">
//           <Button className="btn" size="large">
//             <Text textType="M14">Back</Text>
//           </Button>
//           <Button className="btn" size="large" type="primary" htmlType="submit">
//             <Text textType="M14">Next</Text>
//           </Button>
//         </Flex>
//       </Flex>
//     </Flex>
//   );
// };

export default Welcome;
