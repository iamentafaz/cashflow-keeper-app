import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, Calendar, Target } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface ExpenseDashboardProps {
  expenses: Expense[];
}

export function ExpenseDashboard({ expenses }: ExpenseDashboardProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses
    .filter(expense => expense.date >= monthStart && expense.date <= monthEnd)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Get category breakdown for this month
  const categoryTotals = expenses
    .filter(expense => expense.date >= monthStart && expense.date <= monthEnd)
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="shadow-card bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${totalExpenses.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            All time spending
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${thisMonthExpenses.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(today, "MMMM yyyy")}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {topCategory ? topCategory[0] : 'None'}
          </div>
          <p className="text-xs text-muted-foreground">
            {topCategory ? `$${topCategory[1].toFixed(2)}` : 'No expenses yet'}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {expenses.length}
          </div>
          <p className="text-xs text-muted-foreground">
            All time transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}