//

const transactions = [
  {},
  // tx1
  {
    "id": "txn1",
    "inputs": [],
    "outputs": [
      {
        "address": "address0",
        "value": 50
      }
    ]
  },
  // 
  {
    "id": "txn2",
    "inputs": [],
    "outputs": [
      {
        "address": "address1",
        "value": 10
      }
    ]
  },
  //
  {
    "id": "txn3",
    "inputs": [
      {
        "txId": "txn2",
        "index": 0
      }
    ],
    "outputs": [
      {
        "address": "address2",
        "value": 10
      }
    ]
  },
  //
  {
    "id": "txn4",
    "inputs": [],
    "outputs": [
      {
        "address": "address1",
        "value": 10
      }
    ]
  },
  //
  {
    "id": "txn5",
    "inputs": [
      {
        "txId": "txn3",
        "index": 0
      }
    ],
    "outputs": [
      {
        "address": "address2",
        "value": 5
      },
      {
        "address": "address3",
        "value": 5
      }
    ]
  },
  //
  {
    "id": "txn6",
    "inputs": [
      {
        "txId": "txn4",
        "index": 0
      }
    ],
    "outputs": [
      {
        "address": "address1",
        "value": 8
      },
      {
        "address": "address3",
        "value": 2
      }
    ]
  },
  //
  {
    "id": "txn7",
    "inputs": [
      {
        "txId": "txn5",
        "index": 1
      },
      {
        "txId": "txn6",
        "index": 1
      }
    ],
    "outputs": [
      {
        "address": "address4",
        "value": 6
      },
      {
        "address": "address3",
        "value": 1
      }
    ]
  }
];

export const testSuccessData = [
 // Genesis Block  
  {
    "id": "2ba8bcff56711efcc564923ddb0228df08d89300b5d9b5ab776524d044841de3",
    "height": 0,
    "transactions": [
      transactions[1]
    ]
  },
  //
  {
    "id": "59b43b4061a6b7b886b26a2506548923c1142d5f42d678d5b3421410ab3f5092",
    "height": 1,
    "transactions": [
      transactions[2],
      transactions[3]
    ]
  },
  //
  {
    "id": "8530906204cae0e8bf35f70913b18daaa736760a78a0fe5dfc800bcf5bcc7860",
    "height": 2,
    "transactions": [
      transactions[4],
      transactions[5],
      transactions[6]
    ]
  },
  //
  {
    "id": "9b475e12fff1341715aafb0bb9b24009f13d1648b94c4b3c8d3edfdc57dd2159",
    "height": 3,
    "transactions": [
      transactions[7]
    ]
  },
  //
  {
    "id": "332629d0ab740c45ac203a29dafbabf57c764e1dde6b22239f1190094950339d",
    "height": 2,
    "transactions": [
      transactions[4],
      transactions[5],
      transactions[6],
      transactions[7]
    ]
  }
]

export const testFailedData = [
  // Genesis Block  
  {
    "id": "2ba8bcff56711efcc564923ddb0228df08d89300b5d9b5ab776524d044841de3",
    "height": 0,
    "transactions": [
      transactions[1]
    ]
  },
  //
  {
    "id": "59b43b4061a6b7b886b26a2506548923c1142d5f42d678d5b3421410ab3f5092",
    "height": 1,
    "transactions": [
      transactions[2],
      transactions[3]
    ]
  },
  {
    "id": "8530906204cae0e8bf35f70913b18daaa736760a78a0fe5dfc800bcf5bcc7860",
    "height": 2,
    "transactions": [
      transactions[4],
      {
        ...transactions[5],
        input: [
          {
            "txId": "txn3",
            "index": 1 // Invalid index
          }
        ]
      },
      transactions[6]
    ]
  },
]