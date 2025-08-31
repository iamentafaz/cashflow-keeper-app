import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-dashboard.jpg";
import { ArrowRight, TrendingUp, Shield, PieChart } from "lucide-react";

const Hero = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                Smart Financial Management
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Take Control of Your
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
                  Expenses
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Track every penny, plan your budget, and achieve your financial goals with our intelligent expense management platform. Make informed decisions with powerful analytics and insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline-white" size="lg" className="text-lg">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">$2M+</div>
                <div className="text-sm text-muted-foreground">Money Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <Card className="p-4 shadow-[var(--shadow-elegant)] border-0 bg-gradient-to-br from-white to-gray-50">
              <img 
                src={heroImage} 
                alt="Expense Management Dashboard" 
                className="w-full h-auto rounded-lg"
              />
            </Card>
            
            {/* Floating cards */}
            <Card className="absolute -top-4 -left-4 p-4 bg-white shadow-[var(--shadow-card)] border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-success">+24.5%</div>
                  <div className="text-xs text-muted-foreground">Savings this month</div>
                </div>
              </div>
            </Card>

            <Card className="absolute -bottom-4 -right-4 p-4 bg-white shadow-[var(--shadow-card)] border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold">Secure</div>
                  <div className="text-xs text-muted-foreground">Bank-level encryption</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;