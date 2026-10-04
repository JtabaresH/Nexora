export const nftTransferErrorsAbi = [
  {
    type: "error",
    name: "SoulboundTransfer",
    inputs: [],
  },
  {
    type: "error",
    name: "ERC1155InsufficientBalance",
    inputs: [
      { name: "sender", type: "address" },
      { name: "balance", type: "uint256" },
      { name: "needed", type: "uint256" },
      { name: "tokenId", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "ERC1155InvalidReceiver",
    inputs: [{ name: "receiver", type: "address" }],
  },
  {
    type: "error",
    name: "ERC1155InvalidSender",
    inputs: [{ name: "sender", type: "address" }],
  },
  {
    type: "error",
    name: "ERC1155MissingApprovalForAll",
    inputs: [
      { name: "operator", type: "address" },
      { name: "owner", type: "address" },
    ],
  },
  {
    type: "error",
    name: "ERC721IncorrectOwner",
    inputs: [
      { name: "sender", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
  },
  {
    type: "error",
    name: "ERC721NonexistentToken",
    inputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "error",
    name: "ERC721InvalidReceiver",
    inputs: [{ name: "receiver", type: "address" }],
  },
  {
    type: "error",
    name: "ERC721InsufficientApproval",
    inputs: [
      { name: "operator", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
  },
] as const;
