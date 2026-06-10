import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TransactionSection extends StatelessWidget {
  const TransactionSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
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
        _buildTransactionItem('2026-04-04', 'Rent', Icons.south_west, true, -2000),
        _buildTransactionItem('2026-04-04', 'Income', Icons.north_east, false, 1000),
        _buildTransactionItem('2026-04-04', 'Groceries', Icons.south_west, true, -235),
        _buildTransactionItem('2026-04-04', 'Groceries', Icons.south_west, true, -200),
        _buildTransactionItem('2026-04-04', 'Transport', Icons.swap_horiz, true, -20),
      ],
    );
  }

  Widget _buildTransactionItem(
      String date, String category, IconData icon, bool isExpense, double amount) {
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
            '${amount > 0 ? '+' : ''}${amount.toStringAsFixed(0)} DH',
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
