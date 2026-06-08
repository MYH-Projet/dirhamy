

class BalanceSection extends StatefulWidget {
  const BalanceSection({super.key});

  @override
  State<BalanceSection> createState() => _BalanceSectionState();
}

class _BalanceSectionState extends State<BalanceSection> {
    double totalBalance = 0.0;
    double cashBalance = 0.0;
    double bankBalance = 0.0;
  @override
  Widget build(BuildContext context) {
    return Container(
      child:Card(
        child: Column(
          children: [
            Container(
              height: 50,
              width: double.infinity,
              color: Colors.green,
            ),
            Text('Transactions')
          ]
        )
      )
    );
  }
}