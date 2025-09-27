import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface ChatRoom {
  id: string;
  userId: string;
  consultantId: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ChatPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedChatRoom) {
      fetchMessages(selectedChatRoom.id);
    }
  }, [selectedChatRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatRooms = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.chat.getChatRooms();
      setChatRooms(response);
      
      // Select the first chat room by default
      if (response.length > 0) {
        setSelectedChatRoom(response[0]);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch chat rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatRoomId: string) => {
    try {
      const response = await apiService.chat.getChatMessages(chatRoomId);
      setMessages(response);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom) return;

    try {
      setIsSending(true);
      
      const messageData = {
        chatRoomId: selectedChatRoom.id,
        message: newMessage.trim()
      };
      
      const response = await apiService.chat.sendMessage(messageData);
      
      // Add new message to local state
      setMessages(prev => [...prev, response]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Chat with your consultants</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Chat rooms sidebar */}
        <div className="w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {chatRooms.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {chatRooms.map((room) => (
                    <Button
                      key={room.id}
                      variant={selectedChatRoom?.id === room.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedChatRoom(room)}
                    >
                      <div className="flex flex-col items-start">
                        <span>Consultant Chat</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(room.updatedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat messages area */}
        <div className="flex-1">
          <Card className="h-[600px] flex flex-col">
            {selectedChatRoom ? (
              <>
                <CardHeader>
                  <CardTitle>Consultant Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === user?.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.senderId === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === user?.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {format(new Date(message.createdAt), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}