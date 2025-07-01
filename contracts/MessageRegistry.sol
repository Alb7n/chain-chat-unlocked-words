
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MessageRegistry {
    struct Message {
        string contentHash; // IPFS hash of encrypted content
        address sender;
        address recipient;
        uint256 timestamp;
        uint256 blockNumber;
        bool isEncrypted;
        string metadataHash; // Additional metadata IPFS hash
        uint256 messageType; // 0: text, 1: media, 2: voice
    }
    
    struct Contact {
        address contactAddress;
        string name;
        string ensName;
        uint256 addedAt;
        bool isActive;
        string avatar; // IPFS hash for avatar
    }
    
    mapping(bytes32 => Message) public messages;
    mapping(address => mapping(address => Contact)) public contacts;
    mapping(address => bytes32[]) public userMessages;
    mapping(address => address[]) public userContacts;
    mapping(bytes32 => mapping(string => uint256)) public messageReactions; // messageId => emoji => count
    
    uint256 public totalMessages;
    uint256 public messageFee = 0.001 ether; // Small fee in MATIC
    address public owner;
    
    event MessageSent(
        bytes32 indexed messageId,
        address indexed sender,
        address indexed recipient,
        string contentHash,
        uint256 timestamp,
        uint256 messageType
    );
    
    event ContactAdded(
        address indexed user,
        address indexed contact,
        string name,
        uint256 timestamp
    );
    
    event MessageReaction(
        bytes32 indexed messageId,
        address indexed user,
        string emoji,
        bool added
    );
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function sendMessage(
        address recipient,
        string memory contentHash,
        string memory metadataHash,
        bool isEncrypted,
        uint256 messageType
    ) external payable validAddress(recipient) {
        require(msg.value >= messageFee, "Insufficient fee");
        require(bytes(contentHash).length > 0, "Content hash required");
        require(messageType <= 2, "Invalid message type");
        
        bytes32 messageId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                contentHash,
                block.timestamp,
                totalMessages
            )
        );
        
        messages[messageId] = Message({
            contentHash: contentHash,
            sender: msg.sender,
            recipient: recipient,
            timestamp: block.timestamp,
            blockNumber: block.number,
            isEncrypted: isEncrypted,
            metadataHash: metadataHash,
            messageType: messageType
        });
        
        userMessages[msg.sender].push(messageId);
        userMessages[recipient].push(messageId);
        
        totalMessages++;
        
        emit MessageSent(messageId, msg.sender, recipient, contentHash, block.timestamp, messageType);
    }
    
    function addContact(
        address contactAddress,
        string memory name,
        string memory ensName,
        string memory avatar
    ) external validAddress(contactAddress) {
        require(contactAddress != msg.sender, "Cannot add yourself");
        require(bytes(name).length > 0, "Name required");
        
        contacts[msg.sender][contactAddress] = Contact({
            contactAddress: contactAddress,
            name: name,
            ensName: ensName,
            addedAt: block.timestamp,
            isActive: true,
            avatar: avatar
        });
        
        // Add to user's contact list if not already present
        address[] storage userContactList = userContacts[msg.sender];
        bool exists = false;
        for (uint i = 0; i < userContactList.length; i++) {
            if (userContactList[i] == contactAddress) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            userContacts[msg.sender].push(contactAddress);
        }
        
        emit ContactAdded(msg.sender, contactAddress, name, block.timestamp);
    }
    
    function reactToMessage(bytes32 messageId, string memory emoji, bool add) external {
        require(messages[messageId].sender != address(0), "Message does not exist");
        
        if (add) {
            messageReactions[messageId][emoji]++;
        } else {
            require(messageReactions[messageId][emoji] > 0, "No reaction to remove");
            messageReactions[messageId][emoji]--;
        }
        
        emit MessageReaction(messageId, msg.sender, emoji, add);
    }
    
    function getUserMessages(address user) external view returns (bytes32[] memory) {
        return userMessages[user];
    }
    
    function getUserContacts(address user) external view returns (address[] memory) {
        return userContacts[user];
    }
    
    function getMessage(bytes32 messageId) external view returns (Message memory) {
        return messages[messageId];
    }
    
    function getContact(address user, address contactAddress) external view returns (Contact memory) {
        return contacts[user][contactAddress];
    }
    
    function getMessageReactions(bytes32 messageId, string memory emoji) external view returns (uint256) {
        return messageReactions[messageId][emoji];
    }
    
    function getConversation(address user1, address user2) external view returns (bytes32[] memory) {
        bytes32[] memory user1Messages = userMessages[user1];
        bytes32[] memory conversationMessages = new bytes32[](user1Messages.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < user1Messages.length; i++) {
            Message memory msg = messages[user1Messages[i]];
            if ((msg.sender == user1 && msg.recipient == user2) || 
                (msg.sender == user2 && msg.recipient == user1)) {
                conversationMessages[count] = user1Messages[i];
                count++;
            }
        }
        
        // Resize array to actual count
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = conversationMessages[i];
        }
        
        return result;
    }
    
    function updateMessageFee(uint256 newFee) external onlyOwner {
        messageFee = newFee;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    function getTotalMessages() external view returns (uint256) {
        return totalMessages;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
