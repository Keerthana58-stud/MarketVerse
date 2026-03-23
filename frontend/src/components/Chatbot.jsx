import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { sendChatMessage } from '../services/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi! I’m the MarketVerse support assistant. Ask me about orders, cart, products, stock, or how to use the app.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Clear chat history whenever the user reaches the login page (i.e. logged out)
  useEffect(() => {
    if (location.pathname === '/login') {
      setMessages([
        {
          sender: 'bot',
          text: 'Hi! I’m the MarketVerse support assistant. Ask me about orders, cart, products, stock, or how to use the app.'
        }
      ]);
      setIsOpen(false);
    }
  }, [location.pathname]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await sendChatMessage({ message: userText });
      if (res.data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'I am currently unable to reach the server. Please try again later.';
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        variant="primary"
        onClick={toggleChat}
        className="rounded-circle shadow"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}
      >
        💬
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="shadow-lg border-0"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '350px',
            height: '500px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
            <h5 className="mb-0 fs-6 fw-bold">MarketVerse Assistant</h5>
            <Button variant="link" className="text-white p-0 text-decoration-none fs-5" onClick={toggleChat}>
              &times;
            </Button>
          </Card.Header>

          {/* Messages Area */}
          <Card.Body 
            className="flex-grow-1 overflow-auto bg-light p-3"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-2 px-3 rounded-3 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white text-end' 
                      : 'bg-white text-dark text-start border'
                  }`}
                  style={{ maxWidth: '85%', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="d-flex justify-content-start">
                <div className="p-2 px-3 rounded-3 shadow-sm bg-white text-muted border">
                  <Spinner animation="dots" size="sm" /> Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </Card.Body>

          {/* Input Area */}
          <Card.Footer className="bg-white border-top p-2">
            <Form onSubmit={handleSend} className="d-flex w-100 gap-2">
              <Form.Control
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-grow-1"
                style={{ fontSize: '0.9rem' }}
              />
              <Button type="submit" variant="primary" disabled={isLoading || !input.trim()}>
                Send
              </Button>
            </Form>
          </Card.Footer>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
