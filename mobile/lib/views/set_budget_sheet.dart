import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/categorie_model.dart';
import '../controllers/category_controller.dart';

class SetBudgetSheet extends StatefulWidget {
  final List<CategorieModel> categories;
  final CategorieModel? initialCategory;

  const SetBudgetSheet({
    super.key,
    required this.categories,
    this.initialCategory,
  });

  @override
  State<SetBudgetSheet> createState() => _SetBudgetSheetState();
}

class _SetBudgetSheetState extends State<SetBudgetSheet> {
  CategorieModel? _selectedCategory;
  final TextEditingController _limitController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialCategory != null && widget.categories.isNotEmpty) {
      try {
        _selectedCategory = widget.categories.firstWhere(
          (c) => c.localId == widget.initialCategory!.localId
        );
      } catch (e) {
        _selectedCategory = widget.categories.first;
      }
    } else {
      _selectedCategory = widget.categories.isNotEmpty ? widget.categories.first : null;
    }
    _updateLimitText();
  }

  void _updateLimitText() {
    if (_selectedCategory != null && _selectedCategory!.budgetLimit != null) {
      _limitController.text = _selectedCategory!.budgetLimit!.toStringAsFixed(0);
    } else {
      _limitController.clear();
    }
  }

  Future<void> _saveBudget() async {
    if (_selectedCategory == null) return;
    final limitText = _limitController.text.trim();
    if (limitText.isEmpty) {
      // Treat empty input as removing the budget limit
      await _removeBudget();
      return;
    }

    final limit = double.tryParse(limitText);
    if (limit == null || limit < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid positive number')),
      );
      return;
    }

    _selectedCategory!.budgetLimit = limit;

    await CategoryController().updateCategory(_selectedCategory!);
    if (mounted) Navigator.pop(context);
  }

  Future<void> _removeBudget() async {
    if (_selectedCategory == null) return;

    _selectedCategory!.budgetLimit = null;

    await CategoryController().updateCategory(_selectedCategory!);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final hasExistingLimit = _selectedCategory?.budgetLimit != null;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
                Text(
                  hasExistingLimit ? 'Update Budget Limit' : 'Set Budget Limit',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 48),
              ],
            ),
            const Divider(),
            const SizedBox(height: 16),
            
            const Text('Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.lightestGray,
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<CategorieModel>(
                  value: _selectedCategory,
                  isExpanded: true,
                  items: widget.categories.map((cat) {
                    return DropdownMenuItem<CategorieModel>(
                      value: cat,
                      child: Text(cat.nom),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedCategory = val;
                      _updateLimitText();
                    });
                  },
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            const Text('Monthly Limit Amount', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.lightestGray,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _limitController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      autofocus: true,
                      decoration: const InputDecoration(
                        hintText: 'Enter limit (e.g. 1500)',
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const Text('DH', style: TextStyle(fontSize: 16, color: Colors.grey)),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            Row(
              children: [
                if (hasExistingLimit) ...[
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: OutlinedButton(
                        onPressed: _removeBudget,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.redish,
                          side: BorderSide(color: AppColors.redish),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Remove Limit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                ],
                Expanded(
                  child: SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _saveBudget,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        hasExistingLimit ? 'Update' : 'Set Limit',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
