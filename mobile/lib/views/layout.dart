import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_colors.dart';
import 'transactoins.dart';
import 'budget_page.dart';
import 'categories_page.dart';

class Layout extends StatefulWidget {
  const Layout({super.key});

  State<Layout> createState() => _LayoutState();
}

class _LayoutState extends State<Layout> {
  int _selectedIndex = 0;

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
                IconButton(
                  onPressed: () {
                    
                  }, 
                  icon: Icon(Icons.notifications)
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
            Container(child: const Text('Chats')),
          ],
        ),
      ),
    );
  }
}