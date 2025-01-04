import React from 'react';

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, imageUrl, link }) => {
  return (
    <a href={link} className="relative group">
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-300"> 
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="p-4">
          <h2 className="text-2xl font-pinball text-pink-500 text-shadow-pinball">{title}</h2>
          <p className="text-gray-300 mt-2">{description}</p>
        </div>
      </div>
    </a>
  );
};

export default GameCard;
