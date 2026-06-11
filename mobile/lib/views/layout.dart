import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'transactoins.dart';
import 'budget_page.dart';
import 'categories_page.dart';
import 'auth_page.dart';
import '../controllers/account_controller.dart';
import '../controllers/category_controller.dart';
import '../controllers/transaction_controller.dart';
import '../controllers/budget_controller.dart';
import '../controllers/auth_controller.dart';
import '../controllers/sync_controller.dart';
import '../services/auth_service.dart';
import 'user_page.dart';

class Layout extends StatefulWidget {
  const Layout({super.key});

  @override
  State<Layout> createState() => _LayoutState();
}

class _LayoutState extends State<Layout> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  void _refreshData() {
    AccountController().loadAccountsAndBalances();
    CategoryController().loadCategories();
    TransactionController().loadTransactions();
    BudgetController().loadBudgets();
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4, 
      child: Scaffold(
        appBar: AppBar(
          title: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    SvgPicture.asset(
                      'assets/images/favicon.svg',
                      width: 50,
                      height: 50,
                    ),
                    Text(
                      'Dirhamy',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  ],
                ),
                Row(
                  children: [
                    IconButton(
                      onPressed: () {
                        final authController = AuthController();
                        if (authController.isAuthenticated) {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const UserPage()));
                        } else {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const AuthPage()));
                        }
                      }, 
                      icon: const Icon(Icons.person)
                    ),
                    IconButton(
                      onPressed: () {}, 
                      icon: const Icon(Icons.notifications)
                    ),
                  ],
                )
              ],
            )
          ),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: _onItemTapped,
          destinations: [
            NavigationDestination(
              icon: Icon(Icons.list),
              label: 'Transactions',
            ),
            NavigationDestination(
              icon: Icon(Icons.account_balance_wallet),
              label: 'Budget',
            ),
            NavigationDestination(
              icon: Icon(Icons.category),
              label: 'Category',
            ),
            NavigationDestination(
              icon: Icon(Icons.chat),
              label: 'Chats',
            ),
          ],
        ),
        body: IndexedStack(
          index: _selectedIndex,
          children: [
            const TransactionsPage(),
            const BudgetPage(),
            const CategoriesPage(),
            const Center(child: Text('Chats')),
          ],
        ),
      ),
    );
  }
}