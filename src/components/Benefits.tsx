import { Card } from "@/components/ui/card";
import { Check, DollarSign, Clock, Users, Award } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Save More Money",
      description: "Users typically save 23% more per month by tracking expenses with our platform.",
      stat: "23% Average Savings Increase"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save Time",
      description: "Automated categorization and receipt scanning save hours of manual entry each month.",
      stat: "5+ Hours Saved Monthly"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Better Family Planning",
      description: "Shared budgets and collaborative tracking help families achieve financial harmony.",
      stat: "Family Accounts Available"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Expert Insights",
      description: "Get personalized recommendations based on your spending patterns and goals.",
      stat: "AI-Powered Recommendations"
    }
  ];

  const features = [
    "Real-time expense tracking",
    "Automated bank synchronization",
    "Custom budget categories",
    "Receipt photo capture",
    "Spending trend analysis",
    "Goal progress tracking",
    "Multi-currency support",
    "Export to tax software",
    "Bill reminder alerts",
    "Secure data encryption"
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Benefits Cards */}
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Why Choose Our
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
                Expense Manager?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              More than just expense tracking - it's your complete financial wellness platform.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6 border-0 bg-gradient-to-r from-white to-gray-50/50 hover:shadow-[var(--shadow-card)] transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground mb-3">{benefit.description}</p>
                      <div className="text-sm font-medium text-primary bg-primary/5 px-3 py-1 rounded-full inline-block">
                        {benefit.stat}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Features List */}
          <div>
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-0 sticky top-8">
              <h3 className="text-2xl font-bold mb-6">Everything Included</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-white rounded-lg border border-primary/10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Free</div>
                  <div className="text-muted-foreground mb-4">14-day trial, no credit card required</div>
                  <div className="text-sm text-muted-foreground">
                    Then just $9.99/month with premium features
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;