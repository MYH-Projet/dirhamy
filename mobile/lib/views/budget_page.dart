import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../controllers/budget_controller.dart';
import '../controllers/category_controller.dart';
import 'set_budget_sheet.dart';

class BudgetPage extends StatelessWidget {
  const BudgetPage({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final monthName = _getMonthName(now.month);
    final budgetController = BudgetController();

    return Scaffold(
      backgroundColor: AppColors.lightestGray,
      appBar: AppBar(
        backgroundColor: AppColors.lightestGray,
        elevation: 0,
        title: const Text('Monthly Budget Tracking', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
            child: ElevatedButton(
              onPressed: () {
                if (CategoryController().categories.isNotEmpty) {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (ctx) => SetBudgetSheet(
                      categories: CategoryController().categories,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please create a category first.')),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary.withOpacity(0.1),
                foregroundColor: AppColors.primary,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Set Budget', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          )
        ],
      ),
      body: ListenableBuilder(
        listenable: budgetController,
        builder: (context, child) {
          final categories = budgetController.categories;
          final spentByCategory = budgetController.spentByCategory;

          if (budgetController.isLoading && categories.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 16, color: Colors.black87),
                    children: [
                      const TextSpan(text: 'Track your spending limits for '),
                      TextSpan(text: '$monthName ${now.year}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Expanded(
                  child: categories.isEmpty
                      ? const Center(child: Text('No budgets set. Click "Set Budget".', style: TextStyle(color: Colors.grey)))
                      : ListView.separated(
                          itemCount: categories.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 16),
                          itemBuilder: (context, index) {
                            final cat = categories[index];
                            final spent = spentByCategory[cat.localId] ?? 0.0;
                            final limit = cat.budgetLimit ?? 0.0;
                            
                            // If limit is 0, we treat it differently or avoid crash.
                            final hasLimit = limit > 0;
                            final percent = hasLimit ? (spent / limit) : 0.0;
                            final clampedPercent = percent.clamp(0.0, 1.0);
                            final remaining = limit - spent;
                            
                            final isOver = hasLimit && spent > limit;
                            final isWarning = hasLimit && percent >= 0.8 && !isOver;
                            
                            final barColor = isOver ? AppColors.redish : (isWarning ? Colors.orange : AppColors.primary);
                            final bgColor = isOver ? Colors.red.shade50 : (isWarning ? Colors.orange.shade50 : Colors.teal.shade50);
                            
                            return Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))
                                ]
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(cat.nom, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.edit_outlined, color: Colors.grey, size: 20),
                                        onPressed: () {
                                          showModalBottomSheet(
                                            context: context,
                                            isScrollControlled: true,
                                            backgroundColor: Colors.transparent,
                                            builder: (ctx) => SetBudgetSheet(
                                              categories: CategoryController().categories,
                                              initialCategory: cat,
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    hasLimit ? 'Spent: ${spent.toStringAsFixed(2)} DH · Limit: ${limit.toStringAsFixed(2)} DH' : 'Spent: ${spent.toStringAsFixed(2)} DH (No Limit Set)', 
                                    style: const TextStyle(color: Colors.black87, fontSize: 15)
                                  ),
                                  const SizedBox(height: 16),
                                  if (hasLimit) ...[
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: isOver ? 1.0 : clampedPercent,
                                        backgroundColor: Colors.grey.shade200,
                                        valueColor: AlwaysStoppedAnimation<Color>(barColor),
                                        minHeight: 10,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text('${(percent * 100).toStringAsFixed(0)}%', style: TextStyle(color: barColor, fontWeight: FontWeight.bold)),
                                        Text(isOver ? '${(spent - limit).toStringAsFixed(0)} DH over Budget' : '${remaining.toStringAsFixed(0)} DH left', style: const TextStyle(color: Colors.black87)),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: bgColor,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        isOver ? "You've exceeded your ${cat.nom} budget by ${(spent - limit).toStringAsFixed(0)} DH. Take immediate action to review and adjust your budget." : 
                                        isWarning ? "You've spent ${(percent * 100).toStringAsFixed(0)}% of your ${cat.nom} budget, leaving only ${remaining.toStringAsFixed(0)} DH. Be cautious with your expenses." :
                                        "You've spent ${(percent * 100).toStringAsFixed(0)}% of your ${cat.nom} budget so far. You're in the green!",
                                        style: const TextStyle(color: Colors.black87, fontSize: 14, height: 1.4),
                                      ),
                                    )
                                  ] else ...[
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade100,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text(
                                        "No budget limit set for this category. Consider setting one to track your expenses.",
                                        style: TextStyle(color: Colors.black87, fontSize: 14),
                                      ),
                                    )
                                  ]
                                ],
                              ),
                            );
                          },
                        ),
                )
              ],
            ),
          );
        },
      ),
    );
  }

  String _getMonthName(int month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }
}
