import React, { useState, useEffect } from 'react';  

const AIRecipe = () => {   
  const [currentImageIndex, setCurrentImageIndex] = useState(0);    
  const content = [     
    {       
      image: 'https://images.unsplash.com/photo-1600628421055-4d30de868b8f',       
      quote: "Every meal saved is a step towards ending hunger in India"     
    },     
    {       
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84',       
      quote: "Share food, spread joy, reduce waste in our communities"     
    },     
    {       
      image: 'https://images.unsplash.com/photo-1517427677506-ade074eb1432',       
      quote: "Together we can make surplus food reach those in need across India"     
    },     
    {       
      image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d',       
      quote: "Small actions create big impact - Save food today for a better tomorrow"     
    },     
    {       
      image: 'https://images.unsplash.com/photo-1596451984027-da0a37e0cd7d',       
      quote: "Food waste ends where caring begins - Join the movement"     
    }   
  ];    

  useEffect(() => {     
    const interval = setInterval(() => {       
      setCurrentImageIndex((prevIndex) =>          
        prevIndex === content.length - 1 ? 0 : prevIndex + 1
      );     
    }, 4000);      

    return () => clearInterval(interval);   
  }, []);    

  return (     
    <div>       
      <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center text-center border border-gray-200 relative overflow-hidden h-[230px]">         
        {content.map((item, index) => (           
          <div             
            key={index}             
            className={`absolute inset-0 bg-cover bg-center rounded-lg transition-all duration-1000 ease-in-out ${               
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'             
            }`}             
            style={{               
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${item.image})`,               
              backgroundSize: 'cover',               
              backgroundPosition: 'center',               
              animation: index === currentImageIndex ? 'zoom 4s ease-in-out infinite' : 'none'             
            }}           
          />         
        ))}         
        <div className="relative z-10 p-4 flex flex-col h-full justify-center">           
          <h2 className="text-white text-3xl font-bold mb-4 drop-shadow-lg">             
            Food Rescue Initiative           
          </h2>           
          <p className="text-white text-xl italic font-medium drop-shadow-lg transition-opacity duration-500">             
            {content[currentImageIndex].quote}           
          </p>         
        </div>         
        <style>{`           
          @keyframes zoom {             
            0% { transform: scale(1); }             
            50% { transform: scale(1.1); }             
            100% { transform: scale(1); }           
          }         
        `}</style>       
      </div>     
    </div>   
  ); 
}  

export default AIRecipe;
