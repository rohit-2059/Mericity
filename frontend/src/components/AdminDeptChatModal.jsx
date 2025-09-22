import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faImage, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

const AdminDeptChatModal = ({ isOpen, onClose, department }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chat, setChat] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && department) {
      const initializeChat = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('adminToken');
          if (!token) throw new Error('You are not logged in as admin. Please login again.');
          
          // Create or get existing chat
          const chatResponse = await fetch('http://localhost:5000/chat/admin-dept/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              departmentId: department._id
            })
          });

          if (!chatResponse.ok) {
            let message = `HTTP ${chatResponse.status}`;
            try {
              const errorData = await chatResponse.json();
              message = errorData.message || errorData.error || message;
              console.error('Admin-dept chat creation failed:', errorData);
            } catch {
              /* ignore parse error */
            }
            throw new Error(`Failed to create chat: ${message}`);
          }

          const chatData = await chatResponse.json();
          setChat(chatData.chat);

          // Then load messages
          await loadMessages(chatData.chat._id);
        } catch (error) {
          console.error('Error initializing admin-dept chat:', error);
          alert(`Failed to load chat: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      initializeChat();
    }
  }, [isOpen, department]);

  const loadMessages = async (chatId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('You are not logged in.');
      const response = await fetch(`http://localhost:5000/chat/admin-dept/messages/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          message = err.message || err.error || message;
        } catch { /* ignore parse error */ }
        throw new Error(message);
      }

      const data = await response.json();
      setMessages(data.messages || []);

      // Mark messages as read
      await fetch(`http://localhost:5000/chat/admin-dept/read/${chatId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error loading admin-dept messages:', error);
      // Optional: alert(`Error loading messages: ${error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !chat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('You are not logged in.');
      let response;

      if (selectedImage) {
        // Send image message
        const formData = new FormData();
        formData.append('chatId', chat._id);
        formData.append('image', selectedImage);

        response = await fetch('http://localhost:5000/chat/admin-dept/message/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Send text message
        response = await fetch('http://localhost:5000/chat/admin-dept/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            chatId: chat._id,
            content: newMessage
          })
        });
      }

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const err = await response.json();
          message = err.message || err.error || message;
        } catch { /* ignore parse error */ }
        throw new Error(message);
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error sending admin-dept message:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const isAdminMessage = (message) => {
    return message.senderModel === 'Admin';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Chat with {department?.name || 'Department'}
            </h2>
            <p className="text-sm text-gray-600">
              {department?.departmentType} - {department?.assignedCity}, {department?.assignedState}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-gray-400" />
              <span className="ml-2 text-gray-600">Loading chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${isAdminMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-xs lg:max-w-md">
                  {/* Sender name */}
                  <div className={`text-xs text-gray-500 mb-1 ${isAdminMessage(message) ? 'text-right' : 'text-left'}`}>
                    {isAdminMessage(message) ? 'You (Admin)' : (message.senderId?.name || 'Department')}
                  </div>
                  
                  {/* Message bubble */}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isAdminMessage(message)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.messageType === 'image' ? (
                      <div>
                        <img
                          src={`http://localhost:5000/uploads/${message.imageUrl}`}
                          alt="Shared image"
                          className="max-w-full h-auto rounded-md mb-2"
                        />
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-400 mt-1 ${isAdminMessage(message) ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="p-4 border-t border-gray-200">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 w-20 object-cover rounded-lg border border-gray-300"
              />
              <button
                onClick={clearImageSelection}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingMessage}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Attach image"
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sendingMessage}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || sendingMessage}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px]"
            >
              {sendingMessage ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDeptChatModal;