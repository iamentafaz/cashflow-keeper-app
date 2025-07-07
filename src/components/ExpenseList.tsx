import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Receipt } from "lucide-react";
import { format } from "date-fns";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface ExpenseListProps {
  expenses: Expense[];
}

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-800",
  "Transportation": "bg-blue-100 text-blue-800",
  "Shopping": "bg-purple-100 text-purple-800",
  "Entertainment": "bg-pink-100 text-pink-800",
  "Bills & Utilities": "bg-red-100 text-red-800",
  "Healthcare": "bg-green-100 text-green-800",
  "Travel": "bg-indigo-100 text-indigo-800",
  "Education": "bg-yellow-100 text-yellow-800",
  "Other": "bg-gray-100 text-gray-800"
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No expenses yet. Add your first expense above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Recent Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{expense.description}</h3>
                <Badge
                  variant="secondary"
                  className={categoryColors[expense.category] || categoryColors["Other"]}
                >
                  {expense.category}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(expense.date, "MMM dd, yyyy")}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">
                ${expense.amount.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}