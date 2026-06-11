import 'package:flutter/material.dart';
import 'balanceSection.dart';
import 'TransactionSection.dart';
import '../theme/app_colors.dart';
import 'add_transaction_sheet.dart';
import '../controllers/auth_controller.dart';
import '../controllers/sync_controller.dart';
import '../controllers/account_controller.dart';
import '../controllers/category_controller.dart';
import '../controllers/transaction_controller.dart';
import '../controllers/budget_controller.dart';

class TransactionsPage extends StatefulWidget {
  const TransactionsPage({super.key});

  @override
  State<TransactionsPage> createState() => _TransactionsPageState();
}

class _TransactionsPageState extends State<TransactionsPage> {
  Future<void> _performSync(BuildContext context) async {
    final authController = AuthController();
    if (!authController.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to sync your data.')),
      );
      return;
    }

    final syncController = SyncController();
    final conflicts = await syncController.syncData();

    if (conflicts.isNotEmpty && context.mounted) {
      showDialog(
        context: context,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: const Text("Data Conflict"),
            content: Text("Found \${conflicts.length} conflicting transactions. Keep server data or overwrite with local?"),
            actions: [
              TextButton(
                onPressed: () async {
                  Navigator.of(ctx).pop();
                  await syncController.resolveConflicts(conflicts, keepServer: false);
                  _refreshData();
                },
                child: const Text("Keep Local"),
              ),
              TextButton(
                onPressed: () async {
                  Navigator.of(ctx).pop();
                  await syncController.resolveConflicts(conflicts, keepServer: true);
                  _refreshData();
                },
                child: const Text("Keep Server"),
              ),
            ],
          );
        },
      );
    } else if (context.mounted) {
      _refreshData();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sync completed successfully!')),
      );
    }
  }

  void _refreshData() {
    AccountController().loadAccountsAndBalances();
    CategoryController().loadCategories();
    TransactionController().loadTransactions();
    BudgetController().loadBudgets();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: RefreshIndicator(
        onRefresh: () => _performSync(context),
        color: AppColors.primary,
        child: const SingleChildScrollView(
          physics: AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BalanceSection(),
                SizedBox(height: 24),
                TransactionSection(),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (ctx) => AddTransactionSheet(
              onTransactionAdded: () {
                // State updates are handled automatically by the controllers
              },
            ),
          );
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}