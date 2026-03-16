import { useEffect, useState } from "react";
import { Flex } from "antd";
import "./Splash.scss";
import Text from "@/components/text/Text";

type Phase = "enter" | "hold" | "exit";

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
  logo?: string;
  appName?: string;
}

export default function SplashScreen({
  onFinish,
  duration = 800,
  logo,
  appName = "MyApp",
}: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), duration * 0.2);
    const t2 = setTimeout(() => setPhase("exit"), duration * 0.8);
    const t3 = setTimeout(() => onFinish?.(), duration);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [duration, onFinish]);

  return (
    <Flex vertical align="center" justify="center" className={`splash-container ${phase}`}>
      <Flex align="center" justify="center" className={`splash-logo ${phase}`}>
        {logo ? <img src={logo} alt={appName} /> : <FallbackLogo />}
      </Flex>

      <Flex vertical align="center" gap={3} className={`splash-footer ${phase}`}>
        <Text className="splash-footer__from">from</Text>
        <Text textType="M18" className="splash-footer__name">
          Do Hoai Phong
        </Text>
      </Flex>
    </Flex>
  );
}

function FallbackLogo() {
  return (
    <svg width="100" height="100" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill="url(#lg)" />
      <path
        d="M22 36l10 10 18-20"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6C63FF" />
          <stop offset="1" stopColor="#3ECFCF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
