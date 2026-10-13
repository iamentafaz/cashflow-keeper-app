import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-dashboard.jpg";
import { ArrowRight, TrendingUp, Shield, PieChart } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-gradient-subtle">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute left-[-8rem] top-20 h-72 w-72 animate-soft-pulse rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 right-[-6rem] h-96 w-96 animate-soft-pulse rounded-full bg-accent/10 blur-3xl" />
      
      <div className="container mx-auto px-4 pt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="animate-fade-in-up space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-card backdrop-blur-sm">
                <TrendingUp className="w-4 h-4" />
                Smart Financial Management
              </div>
              <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground lg:text-7xl">
                Take Control of Your
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Expenses
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
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
            <div className="grid max-w-lg grid-cols-3 gap-4 border-t border-border/70 pt-8 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary sm:text-3xl">50K+</div>
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
          <div className="relative animate-fade-in-up [animation-delay:180ms]">
            <Card className="animate-float border border-white/70 bg-gradient-card p-3 shadow-elegant sm:p-4">
              <img 
                src={heroImage} 
                alt="Expense Management Dashboard" 
                className="w-full h-auto rounded-lg"
              />
            </Card>
            
            {/* Floating cards */}
            <Card className="absolute -left-3 -top-4 animate-fade-in-up border-white/80 bg-card/90 p-4 shadow-card backdrop-blur-sm sm:-left-8">
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

            <Card className="absolute -bottom-4 -right-3 animate-fade-in-up border-white/80 bg-card/90 p-4 shadow-card backdrop-blur-sm sm:-right-8">
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
