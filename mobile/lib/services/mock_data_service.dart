import '../models/dbContext.dart';
import '../models/compte_model.dart';
import '../models/categorie_model.dart';
import '../models/transaction_model.dart';

class MockDataService {
  static Future<void> populate() async {
    final db = await DbContext.db;

    // Check if database is already populated
    final accounts = await db.query('comptes');
    if (accounts.isNotEmpty) return;

    // 1. Add Accounts
    final mainBank = CompteModel(nom: 'Main Bank', type: 'bank', updatedAt: DateTime.now(), syncStatus: 0);
    final cashWallet = CompteModel(nom: 'Cash Wallet', type: 'cash', updatedAt: DateTime.now(), syncStatus: 0);
    
    final mainBankId = await db.insert('comptes', mainBank.toMap());
    final cashWalletId = await db.insert('comptes', cashWallet.toMap());

    // 2. Add Categories
    final groceries = CategorieModel(nom: 'Groceries', budgetLimit: 500, updatedAt: DateTime.now(), syncStatus: 0);
    final rent = CategorieModel(nom: 'Rent', budgetLimit: 1200, updatedAt: DateTime.now(), syncStatus: 0);
    final transport = CategorieModel(nom: 'Transport', budgetLimit: 100, updatedAt: DateTime.now(), syncStatus: 0);
    final salary = CategorieModel(nom: 'Salary', updatedAt: DateTime.now(), syncStatus: 0);

    final groceriesId = await db.insert('categories', groceries.toMap());
    final rentId = await db.insert('categories', rent.toMap());
    final transportId = await db.insert('categories', transport.toMap());
    final salaryId = await db.insert('categories', salary.toMap());

    // 3. Add Transactions
    final now = DateTime.now();
    
    // Some groceries
    await db.insert('transactions', TransactionModel(
      amount: 465.0, type: 'expense', date: now, description: 'Supermarket', 
      updatedAt: now, compteId: mainBankId, categorieId: groceriesId, syncStatus: 0
    ).toMap());

    // Rent
    await db.insert('transactions', TransactionModel(
      amount: 2000.0, type: 'expense', date: now, description: 'Monthly Rent', 
      updatedAt: now, compteId: mainBankId, categorieId: rentId, syncStatus: 0
    ).toMap());

    // Salary
    await db.insert('transactions', TransactionModel(
      amount: 5000.0, type: 'income', date: now.subtract(const Duration(days: 2)), description: 'Job', 
      updatedAt: now, compteId: mainBankId, categorieId: salaryId, syncStatus: 0
    ).toMap());

    // Transport
    await db.insert('transactions', TransactionModel(
      amount: 0.0, type: 'expense', date: now, description: 'Setup', 
      updatedAt: now, compteId: cashWalletId, categorieId: transportId, syncStatus: 0
    ).toMap());
  }
}
