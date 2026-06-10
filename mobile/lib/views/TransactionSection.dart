import 'package:flutter/material.dart';
import '../controllers/transaction_controller.dart';
import '../theme/app_colors.dart';
import '../utils/category_icons.dart';
import 'add_transaction_sheet.dart';

class TransactionSection extends StatelessWidget {
  const TransactionSection({super.key});

  @override
  Widget build(BuildContext context) {
    final transactionController = TransactionController();

    return ListenableBuilder(
      listenable: transactionController,
      builder: (context, child) {
        final transactions = transactionController.transactions;

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: AppColors.lightestGray,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Recent Transactions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              if (transactionController.isLoading && transactions.isEmpty)
                const Center(child: CircularProgressIndicator())
              else if (transactions.isEmpty)
                Container(
                  height: 300,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'There is no transaction. Make your first!',
                        style: TextStyle(fontSize: 16, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (ctx) => AddTransactionSheet(
                              onTransactionAdded: () {
                                // Handled automatically by the controller
                              },
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Add Transaction'),
                      )
                    ],
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: transactions.length,
                  itemBuilder: (context, index) {
                    final item = transactions[index];
                    return GestureDetector(
                      onLongPress: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (ctx) => AddTransactionSheet(
                            transactionToEdit: item.transaction,
                            onTransactionAdded: () {
                              // Handled automatically by the controller
                            },
                          ),
                        );
                      },
                      child: _buildTransactionItem(
                        context,
                        item.transaction.date.toIso8601String().split('T')[0],
                        item.category?.nom ?? 'Unknown',
                        item.transaction.type == 'transfer'
                            ? Icons.swap_horiz
                            : CategoryIcons.getIcon(item.category?.icon),
                        item.transaction.type == 'expense',
                        item.transaction.amount,
                      ),
                    );
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTransactionItem(
      BuildContext context, String date, String category, IconData icon, bool isExpense, double amount) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Row(
        children: [
          Text(
            date,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black87,
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isExpense ? Colors.red.shade50 : Colors.teal.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 16,
                  color: isExpense ? AppColors.redish : AppColors.primary,
                ),
                const SizedBox(width: 4),
                Text(
                  category,
                  style: TextStyle(
                    fontSize: 14,
                    color: isExpense ? AppColors.redish : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          Text(
            '${amount > 0 && !isExpense ? '+' : ''}${amount.toStringAsFixed(0)} DH',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: isExpense ? AppColors.redish : AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}
