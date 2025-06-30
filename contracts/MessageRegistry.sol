
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
    }
    
    struct Contact {
        address contactAddress;
        string name;
        string ensName;
        uint256 addedAt;
        bool isActive;
    }
    
    mapping(bytes32 => Message) public messages;
    mapping(address => mapping(address => Contact)) public contacts;
    mapping(address => bytes32[]) public userMessages;
    mapping(address => address[]) public userContacts;
    
    uint256 public totalMessages;
    uint256 public messageFee = 0.001 ether; // Small fee in MATIC
    
    event MessageSent(
        bytes32 indexed messageId,
        address indexed sender,
        address indexed recipient,
        string contentHash,
        uint256 timestamp
    );
    
    event ContactAdded(
        address indexed user,
        address indexed contact,
        string name,
        uint256 timestamp
    );
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    function sendMessage(
        address recipient,
        string memory contentHash,
        string memory metadataHash,
        bool isEncrypted
    ) external payable validAddress(recipient) {
        require(msg.value >= messageFee, "Insufficient fee");
        require(bytes(contentHash).length > 0, "Content hash required");
        
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
            metadataHash: metadataHash
        });
        
        userMessages[msg.sender].push(messageId);
        userMessages[recipient].push(messageId);
        
        totalMessages++;
        
        emit MessageSent(messageId, msg.sender, recipient, contentHash, block.timestamp);
    }
    
    function addContact(
        address contactAddress,
        string memory name,
        string memory ensName
    ) external validAddress(contactAddress) {
        require(contactAddress != msg.sender, "Cannot add yourself");
        require(bytes(name).length > 0, "Name required");
        
        contacts[msg.sender][contactAddress] = Contact({
            contactAddress: contactAddress,
            name: name,
            ensName: ensName,
            addedAt: block.timestamp,
            isActive: true
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
    
    function updateMessageFee(uint256 newFee) external {
        // In a real deployment, add access control
        messageFee = newFee;
    }
    
    function withdrawFees() external {
        // In a real deployment, add access control
        payable(msg.sender).transfer(address(this).balance);
    }
}
