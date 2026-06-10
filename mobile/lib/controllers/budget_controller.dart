import 'package:flutter/material.dart';
import '../models/categorie_model.dart';
import '../repository/CategorieRepository.dart';
import '../repository/TransactionRepository.dart';

class BudgetController extends ChangeNotifier {
  // Singleton pattern for global access
  static final BudgetController _instance = BudgetController._internal();
  factory BudgetController() => _instance;
  BudgetController._internal();

  final CategorieRepository _categoryRepo = CategorieRepository();
  final TransactionRepository _txRepo = TransactionRepository();

  List<CategorieModel> categories = [];
  Map<int, double> spentByCategory = {};
  bool isLoading = false;

  Future<void> loadBudgets() async {
    isLoading = true;
    notifyListeners();
    try {
      final cats = await _categoryRepo.getAllCategories();
      final allTx = await _txRepo.getRecentTransactionsWithCategory(limit: 1000);
      
      Map<int, double> spent = {};
      for (var cat in cats) {
        if (cat.localId != null) {
          spent[cat.localId!] = 0.0;
        }
      }

      final now = DateTime.now();
      for (var t in allTx) {
        if (t.transaction.type == 'expense' && t.transaction.categorieId != null) {
          if (t.transaction.date.year == now.year && t.transaction.date.month == now.month) {
            spent[t.transaction.categorieId!] = (spent[t.transaction.categorieId!] ?? 0) + t.transaction.amount;
          }
        }
      }

      // Show categories that either have a budget limit or have spending this month
      categories = cats.where((c) => (c.budgetLimit != null && c.budgetLimit! > 0) ).toList();
      spentByCategory = spent;
    } catch (e) {
      debugPrint('Error loading budgets: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
