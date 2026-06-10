import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/compte_model.dart';
import '../models/categorie_model.dart';
import '../models/transaction_model.dart';
import '../controllers/account_controller.dart';
import '../controllers/category_controller.dart';
import '../controllers/transaction_controller.dart';

class AddTransactionSheet extends StatefulWidget {
  final VoidCallback onTransactionAdded;
  final TransactionModel? transactionToEdit;
  
  const AddTransactionSheet({
    super.key, 
    required this.onTransactionAdded,
    this.transactionToEdit,
  });

  @override
  State<AddTransactionSheet> createState() => _AddTransactionSheetState();
}

class _AddTransactionSheetState extends State<AddTransactionSheet> {
  String _type = 'expense';
  DateTime _selectedDate = DateTime.now();
  final TextEditingController _amountController = TextEditingController();
  
  List<CompteModel> _accounts = [];
  CompteModel? _selectedAccount;
  CompteModel? _selectedToAccount;
  
  List<CategorieModel> _categories = [];
  CategorieModel? _selectedCategory;

  @override
  void initState() {
    super.initState();
    if (widget.transactionToEdit != null) {
      _type = widget.transactionToEdit!.type;
      _selectedDate = widget.transactionToEdit!.date;
      _amountController.text = widget.transactionToEdit!.amount.toString();
    }
    _loadData();
  }

  Future<void> _loadData() async {
    // Ensure data is loaded in controllers
    if (AccountController().accounts.isEmpty) {
      await AccountController().loadAccountsAndBalances();
    }
    if (CategoryController().categories.isEmpty) {
      await CategoryController().loadCategories();
    }

    final accounts = AccountController().accounts;
    final categories = CategoryController().categories;
    
    if (mounted) {
      setState(() {
        _accounts = accounts;
        if (_accounts.isNotEmpty) {
          if (widget.transactionToEdit != null) {
            _selectedAccount = _accounts.firstWhere(
              (a) => a.localId == widget.transactionToEdit!.compteId,
              orElse: () => _accounts.first,
            );
            if (widget.transactionToEdit!.idDestination != null) {
              _selectedToAccount = _accounts.firstWhere(
                (a) => a.localId == widget.transactionToEdit!.idDestination,
                orElse: () => _accounts.length > 1 ? _accounts[1] : _accounts.first,
              );
            } else {
              _selectedToAccount = _accounts.length > 1 ? _accounts[1] : _accounts.first;
            }
          } else {
            _selectedAccount = _selectedAccount ?? _accounts.first;
            if (_accounts.length > 1) {
              _selectedToAccount = _selectedToAccount ?? _accounts[1];
            } else {
              _selectedToAccount = _selectedToAccount ?? _accounts.first;
            }
          }
        }
        
        _categories = categories;
        if (_categories.isNotEmpty) {
          if (widget.transactionToEdit != null) {
            _selectedCategory = _categories.firstWhere(
              (c) => c.localId == widget.transactionToEdit!.categorieId,
              orElse: () => _categories.first,
            );
          } else {
            _selectedCategory = _selectedCategory ?? _categories.first;
          }
        }
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _saveTransaction() async {
    final amountText = _amountController.text.trim();
    if (amountText.isEmpty || _selectedAccount == null) return;
    if (_type != 'transfer' && _selectedCategory == null) return;
    if (_type == 'transfer' && _selectedToAccount == null) return;
    
    final amount = double.tryParse(amountText);
    if (amount == null) return;
    
    if (widget.transactionToEdit != null) {
      final tx = widget.transactionToEdit!;
      tx.amount = amount;
      tx.type = _type;
      tx.date = _selectedDate;
      tx.compteId = _selectedAccount!.localId;
      tx.idDestination = _type == 'transfer' ? _selectedToAccount!.localId : null;
      tx.categorieId = _selectedCategory!.localId;
      tx.updatedAt = DateTime.now();

      await TransactionController().updateTransaction(tx);
    } else {
      final newTx = TransactionModel(
        amount: amount,
        type: _type,
        date: _selectedDate,
        description: '',
        updatedAt: DateTime.now(),
        compteId: _selectedAccount!.localId,
        idDestination: _type == 'transfer' ? _selectedToAccount!.localId : null,
        categorieId: _selectedCategory!.localId,
        syncStatus: 0,
      );
      await TransactionController().addTransaction(newTx);
    }
    
    widget.onTransactionAdded();
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              left: 24,
              right: 24,
              top: 16,
            ),
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
                      widget.transactionToEdit != null ? 'Update Transaction' : 'Add Transaction',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 48), // to balance the close button
                  ],
                ),
                const Divider(),
                const SizedBox(height: 16),
                
                const Text('Type', style: TextStyle(fontSize: 16)),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _type = 'expense'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _type == 'expense' ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                'Expense',
                                style: TextStyle(
                                  color: _type == 'expense' ? Colors.white : Colors.black87,
                                  fontWeight: _type == 'expense' ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _type = 'income'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _type == 'income' ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                'Income',
                                style: TextStyle(
                                  color: _type == 'income' ? Colors.white : Colors.black87,
                                  fontWeight: _type == 'income' ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _type = 'transfer'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _type == 'transfer' ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                'Transfer',
                                style: TextStyle(
                                  color: _type == 'transfer' ? Colors.white : Colors.black87,
                                  fontWeight: _type == 'transfer' ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                Text(_type == 'transfer' ? 'From Account' : 'Account', style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<CompteModel>(
                      isExpanded: true,
                      value: _selectedAccount,
                      icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.primary),
                      items: _accounts.map((account) {
                        return DropdownMenuItem(
                          value: account,
                          child: Text(account.nom),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedAccount = val);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                if (_type == 'transfer') ...[
                  const Text('To Account', style: TextStyle(fontSize: 16)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<CompteModel>(
                        isExpanded: true,
                        value: _selectedToAccount,
                        icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.primary),
                        items: _accounts.map((account) {
                          return DropdownMenuItem(
                            value: account,
                            child: Text(account.nom),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() => _selectedToAccount = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                const Text('Category', style: TextStyle(fontSize: 16)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<CategorieModel>(
                        isExpanded: true,
                        value: _selectedCategory,
                        icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.primary),
                        items: _categories.map((cat) {
                          return DropdownMenuItem(
                            value: cat,
                            child: Text(cat.nom),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() => _selectedCategory = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                
                const Text('Date', style: TextStyle(fontSize: 16)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () => _selectDate(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${_selectedDate.day.toString().padLeft(2, '0')} / ${_selectedDate.month.toString().padLeft(2, '0')} / ${_selectedDate.year}',
                          style: const TextStyle(fontSize: 16),
                        ),
                        const Icon(Icons.calendar_month, color: AppColors.primary),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                const Text('Amount (DH)', style: TextStyle(fontSize: 16)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _amountController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.right,
                          decoration: const InputDecoration(
                            border: InputBorder.none,
                            hintText: '0.00',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text('DH', style: TextStyle(fontSize: 20, color: Colors.grey)),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _saveTransaction,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(widget.transactionToEdit != null ? 'Update' : 'Add', style: const TextStyle(fontSize: 18, color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
