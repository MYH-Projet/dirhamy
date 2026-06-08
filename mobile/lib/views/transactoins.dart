

class TransactionsPage extends StatelessWidget {
  const TransactionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      child:Column(
        children: [
          Card(
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
        ]
      )
    )
  }
}