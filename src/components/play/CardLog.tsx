import React from 'react';
import { CardUsage } from '@/types/type';

interface CardLogProps {
  usedCardsLog: CardUsage[];
  getCardInfo: (name: string) => any;
  showCardInfo: (cardTitle: string, description: string) => void;
  // ĐÃ LOẠI BỎ hideCardInfo
}

const CardLog: React.FC<CardLogProps> = ({ usedCardsLog, getCardInfo, showCardInfo }) => {
  return (
    <div className="w-full lg:w-1/4 bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl ring-1 ring-white/20">
      <h3 className="text-xl font-bold text-white mb-4 text-center">Lịch sử dùng thẻ</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {usedCardsLog.map((log, index) => {
          const cardInfo = getCardInfo(log.cardTitle);
          return (
            <div
              key={index}
              className="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => showCardInfo(log.cardTitle, log.cardDescription)}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cardInfo?.emoji || '🃏'}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{log.playerName}</p>
                  <p className="text-white/80 text-xs">Đã dùng: {log.cardTitle}</p>
                  <p className="text-white/60 text-xs">Câu {log.questionNumber}</p>
                </div>
              </div>
            </div>
          );
        })}
        {usedCardsLog.length === 0 && (
          <p className="text-white/60 text-center text-sm">Chưa có thẻ nào được sử dụng</p>
        )}
      </div>
    </div>
  );
};

export default CardLog;