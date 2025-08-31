import { Card } from "@/components/ui/card";
import { 
  Smartphone, 
  PieChart, 
  TrendingUp, 
  Shield, 
  Bell, 
  Target,
  CreditCard,
  BarChart3,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile First",
      description: "Track expenses on-the-go with our intuitive mobile app. Snap receipts, categorize instantly.",
      color: "text-primary"
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      title: "Smart Categories",
      description: "AI-powered categorization automatically sorts your expenses for better budget insights.",
      color: "text-accent"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Spending Analytics",
      description: "Detailed reports and visualizations help you understand your spending patterns.",
      color: "text-success"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Level Security",
      description: "256-bit encryption and secure connections keep your financial data protected.",
      color: "text-primary"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Alerts",
      description: "Get notified when you're approaching budget limits or unusual spending patterns.",
      color: "text-warning"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Goal Tracking",
      description: "Set savings goals and track your progress with motivational milestones.",
      color: "text-success"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Multi-Account Support",
      description: "Connect multiple bank accounts and credit cards for comprehensive tracking.",
      color: "text-accent"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Custom Reports",
      description: "Generate detailed financial reports for personal or business use with export options.",
      color: "text-primary"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Sync",
      description: "Instant synchronization across all your devices keeps your data up-to-date.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
              Manage Your Money
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive suite of tools makes expense tracking effortless and financial planning intuitive.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-[var(--shadow-elegant)] transition-all duration-300 hover:translate-y-[-4px] border-0 bg-gradient-to-br from-white to-gray-50/50"
            >
              <div className={`w-12 h-12 rounded-lg bg-current/10 flex items-center justify-center mb-4 ${feature.color}`}>
                <span className={feature.color}>
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;