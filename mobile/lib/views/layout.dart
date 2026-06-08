

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_colors.dart';

class Layout extends StatelessWidget {
  const Layout({super.key});
  
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3, 
      child: Scaffold(
        appBar: AppBar(
          title: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                SvgPicture.asset(
                  'assets/images/logo.svg',
                  width: 200,
                  height: 200,
                )
              ],
            )
          ),
        ),
        bottomNavigationBar: TabBar(
          tabs: [
            Tab(text: 'Transactions'),
            Tab(text: 'Budget'),
            Tab(text: 'Category'),
            Tab(text: 'Chats'),
          ],
        ),
        body: TabBarView(
          children: [
            Container(child: Text('Transactions')),
            Container(child: Text('Budget')),
            Container(child: Text('Category')),
            Container(child: Text('Chats')),
          ],
        ),
      ),
    );
  }
}