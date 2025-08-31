import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Scan, BarChart, Target, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Connect Your Accounts",
      description: "Securely link your bank accounts, credit cards, and payment methods in minutes.",
      step: "01"
    },
    {
      icon: <Scan className="w-8 h-8" />,
      title: "Track Expenses",
      description: "Automatically categorize transactions or manually add expenses with receipt scanning.",
      step: "02"
    },
    {
      icon: <BarChart className="w-8 h-8" />,
      title: "Analyze Patterns",
      description: "Get insights into your spending habits with detailed analytics and visualizations.",
      step: "03"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Achieve Goals",
      description: "Set budgets, create savings goals, and track your progress toward financial freedom.",
      step: "04"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with expense tracking in just a few simple steps. No complex setup required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="p-6 text-center hover:shadow-[var(--shadow-elegant)] transition-all duration-300 border-0 bg-white h-full">
                <div className="text-6xl font-bold text-primary/10 mb-4">{step.step}</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-0 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Take Control?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of users who have already transformed their financial habits with our platform.
            </p>
            <Button variant="hero" size="lg">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;