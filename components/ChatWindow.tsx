
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { ChatMessage, User } from '../types';
import { mockBackend } from '../services/mockBackend';
import { useTranslation } from 'react-i18next';

interface ChatWindowProps {
  jobId: string;
  currentUser: User;
  otherUserName: string;
  onClose?: () => void;
  isReadOnly?: boolean;
}

// A more comprehensive list of common emojis
const ALL_EMOJIS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😮', '🤥', '😳', '😔', '😟', '😠', '😡', '🤬', '🥺', '😭',
  '😤', '😩', '😫', '😴', '🤤', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
  '👍', '👎', '👌', '👏', '🤝', '🙏', '🙌', '👋', '💪', '🙏', '❤️', '💔', '💖', '✨', '🔥', '🎉', '🎊', '🎁', '🎈', '🍾',
  '🚀', '💡', '🌈', '☀️', '⭐', '💯', '✅', '❌', '🚫', '❓', '❕', '❗', '🛑', '⚠️', '🔔', '📣', '💬', '💭', '🗣️', '👤',
  '👥', '👪', '👩‍❤️‍👨', '👨‍👩‍👧‍👦', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐅', '🦁', '🐎', '🦌', '🐮', '🐷', '🐸',
  '🐒', '🦍', '🐔', '🐦', '🦉', '🦆', '🦅', '🐠', '🐳', '🐬', '🦀', '🦐', '🦑', '🐌', '🦋', '🐞', '🐝', '🐜', '🕷️', '🐍',
  '🌳', '🌲', '🌴', '🌵', '🌾', '🌷', '🌸', '🌹', '🌻', '🌼', '🍁', '🍂', '🍄', '🍓', '🍒', '🍎', '🍊', '🍋', '🍌', '🍉',
  '🍇', '🥝', '🍅', '🌶️', '🌽', '🥕', '🥔', '🥦', '🍞', '🧀', '🍔', '🍟', '🍕', '🌮', '🍣', '🍦', '🍩', '🍪', '🍫', '🍬',
  '🍭', '🍮', '☕', '🍵', '🍺', '🍷', '🍸', '🍹', '🧉', '🍴', '🥄', '🔪', '🏺', '🌍', '🌎', '🌏', '🏠', '🏡', '🏘️', '🏢',
  '🏣', '🏥', '🏦', '🏭', '🏟️', '🏫', '🏛️', '⛪', '🕌', '🕍', '⛩️', '🗾', '🗻', '🗼', '🗽', '🗿', '🎡', '🎢', '🎠', '🏖️',
  '🏝️', '🏜️', '🏞️', '🛣️', '🛤️', ' BRIDGE_AT_NIGHT', '🌃', '🌆', '🏙️', '🌇', '🌉', '🌁', '♨️', '🌌', '🌠', '🎇', '🎆', '🎑', '🏙️',
  '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟',
  '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🗑️',
  '🛒', '🛍️', '🎁', '✉️', '📧', '📨', '📩', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️',
  '📊', '📈', '📉', '📜', '📄', '📅', '📆', '🗓️', '📖', '📚', '🔖', '🏷️', '💰', '🪙', '💴', '💵', '💶', '💷', '💳', '🧾',
  '💲', '✉️', '📥', '📤', '📦', '📭', '📫', '📪', '📬', '📯', '🗞️', '📰', '🪨', '✂️', '📏', '📐', '📍', '📌', '📎', '🖇️',
  '🔗', '🪢', '⛓️', '🔑', '🗝️', '🔓', '🔒', '🔏', '🔐', '🪄', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛀', '🧼', '🪥', '🪒',
  '🧴', '🧽', '🧯', '🪓', '🪚', '🔨', '⚒️', '🛠️', '⛏️', '🪛', '🔩', '⚙️', '🪝', '🪜', '🚧', '🚦', '🛑', '🚥', '🚨', '🚔',
  '🚍', '🚘', '🚖', '🚕', '🚗', '🚙', '🚚', '🚛', '🚐', '🚌', '🚎', '🚒', '🚑', '🚓', '🏎️', '🏍️', '🛵', '🚲', '🛴', '🦼',
  '🦽', '♿', '🛼', '🛹', '🚏', '🛣️', '🛤️', '⛽', '🛢️', '🛻', '🛼', '🛷', '🛥️', '🚤', '🚢', '⚓', '🛟', '🛶', '⛵', '⛴️',
  '🚁', '🛩️', '✈️', '🛫', '🛬', '🛰️', '🛰️', '🧑‍🚀', '🛸', '🚪', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🪚', '🧰', '🧱', '🪵', '🛖',
  '⛺', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏛️', '💒', '🕌', '🕍', '⛪', '🕋', '⛲', '🛕', '⛩️', '🛣️', '🗺️', '🧭',
];

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void; onClose: () => void; pickerRef: React.RefObject<HTMLDivElement> }> = ({ onSelect, onClose, pickerRef }) => {
  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 max-h-64 overflow-y-auto animate-slide-up-fade origin-bottom-right"
      style={{ width: '280px' }} // Fixed width for better grid alignment
    >
      <div className="grid grid-cols-7 gap-1">
        {ALL_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="p-1 rounded-md text-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={`Send ${emoji} emoji`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ jobId, currentUser, otherUserName, onClose, isReadOnly }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const loadMessages = async () => {
    const jobs = await mockBackend.getJobs(currentUser.role, currentUser.id);
    const job = jobs.find(j => j.id === jobId);
    if (job && job.messages) {
      setMessages(job.messages);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    await mockBackend.sendMessage(jobId, currentUser.id, text);
    setText('');
    loadMessages();
  };

  const handleSendEmoji = async (emoji: string) => {
    await mockBackend.sendMessage(jobId, currentUser.id, emoji);
    loadMessages();
    setShowEmojiPicker(false); // Close picker after sending emoji
  };

  return (
    <div className="flex flex-col h-full rounded-xl shadow-inner overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Chat with {otherUserName}</h4>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
          </span>
        </div>
        {onClose && <button onClick={onClose}><Icons.X className="w-5 h-5 text-slate-400" /></button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100 dark:bg-slate-950 no-scrollbar">
        {messages.map(msg => {
          const isMe = !isReadOnly && msg.senderId === currentUser.id;
          const isReaction = ALL_EMOJIS.includes(msg.text) && msg.text.length === 1; // Check if it's a single emoji

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] md:max-w-[60%] px-3 py-2 text-sm break-words
                  ${isMe 
                    ? (isReaction ? 'bg-transparent' : 'bg-red-600 text-white rounded-xl rounded-br-none') 
                    : (isReaction ? 'bg-transparent' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl rounded-bl-none shadow-sm')
                  }
                  ${isReaction ? 'text-4xl' : ''}
              `}>
                {!isReaction && isReadOnly && <div className="text-xs text-slate-400 font-bold mb-1">{msg.senderName}</div>}
                
                <span>{msg.text}</span>

                {!isReaction && (
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-red-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!isReadOnly && (
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 relative flex-shrink-0">
            {showEmojiPicker && (
                <EmojiPicker onSelect={handleSendEmoji} onClose={() => setShowEmojiPicker(false)} pickerRef={emojiPickerRef} />
            )}
            <form onSubmit={handleSend} className="flex gap-2 items-center">
                <button
                  type="button"
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full text-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Open emoji picker"
                >
                  😀
                </button>
                <input 
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  placeholder={t('type_message')}
                />
                <button type="submit" className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
                  <Icons.Send className="w-5 h-5" />
                </button>
            </form>
        </div>
      )}
    </div>
  );
};
