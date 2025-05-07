import { useState, useEffect } from 'react'
import './App.css'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Gamepad2, Trophy, RotateCcw, Clock, Star } from 'lucide-react'

type CardType = {
  id: number
  emoji: string
  flipped: boolean
  matched: boolean
}

type Difficulty = 'easy' | 'medium' | 'hard'

function App() {
  const [cards, setCards] = useState<CardType[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const allEmojis = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🦄'],
    fruits: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🥭'],
    vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚚', '🚛', '✈️']
  }

  const getEmojisForDifficulty = (): string[] => {
    const categories = Object.values(allEmojis)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    switch(difficulty) {
      case 'easy':
        return randomCategory.slice(0, 6)
      case 'hard':
        return randomCategory
      case 'medium':
      default:
        return randomCategory.slice(0, 8)
    }
  }

  const initializeGame = () => {
    const emojisToUse = getEmojisForDifficulty()
    
    const initialCards = [...emojisToUse, ...emojisToUse]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }))

    setCards(initialCards)
    setFlippedCards([])
    setMoves(0)
    setGameWon(false)
    setScore(0)
    setTimer(0)
    setIsPlaying(true)
  }

  const handleCardClick = (id: number) => {
    if (gameWon || cards[id].flipped || cards[id].matched || flippedCards.length >= 2) {
      return
    }

    const updatedCards = [...cards]
    updatedCards[id].flipped = true
    setCards(updatedCards)
    
    const updatedFlippedCards = [...flippedCards, id]
    setFlippedCards(updatedFlippedCards)

    if (updatedFlippedCards.length === 2) {
      setMoves(moves + 1)
      
      const [firstCardId, secondCardId] = updatedFlippedCards
      const firstCard = updatedCards[firstCardId]
      const secondCard = updatedCards[secondCardId]

      if (firstCard.emoji === secondCard.emoji) {
        updatedCards[firstCardId].matched = true
        updatedCards[secondCardId].matched = true
        setCards(updatedCards)
        setFlippedCards([])
        
        const difficultyMultiplier = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15
        setScore(score + difficultyMultiplier)
        
        if (updatedCards.every(card => card.matched)) {
          setGameWon(true)
          setIsPlaying(false)
        }
      } else {
        setTimeout(() => {
          updatedCards[firstCardId].flipped = false
          updatedCards[secondCardId].flipped = false
          setCards(updatedCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty)
    setTimeout(initializeGame, 100)
  }

  useEffect(() => {
    let interval: number | undefined
    
    if (isPlaying && !gameWon) {
      interval = window.setInterval(() => {
        setTimer(prevTimer => prevTimer + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, gameWon])

  useEffect(() => {
    initializeGame()
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex flex-col items-center p-4">
      <header className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gamepad2 size={32} className="text-purple-600" />
          <h1 className="text-3xl font-bold text-purple-800">記憶ゲーム</h1>
          <Gamepad2 size={32} className="text-purple-600" />
        </div>
        <p className="text-gray-600">カードをめくって、ペアを見つけよう！</p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <Button 
          variant={difficulty === 'easy' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => changeDifficulty('easy')}
          className={difficulty === 'easy' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          簡単
        </Button>
        <Button 
          variant={difficulty === 'medium' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => changeDifficulty('medium')}
          className={difficulty === 'medium' ? 'bg-blue-600 hover:bg-blue-700' : ''}
        >
          普通
        </Button>
        <Button 
          variant={difficulty === 'hard' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => changeDifficulty('hard')}
          className={difficulty === 'hard' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          難しい
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <Badge variant="outline" className="text-sm px-3 py-1 bg-white flex items-center gap-1">
          <Clock size={14} /> {formatTime(timer)}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 bg-white flex items-center gap-1">
          <RotateCcw size={14} /> 移動: {moves}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1 bg-white flex items-center gap-1">
          <Star size={14} /> スコア: {score}
        </Badge>
      </div>

      <div className={`grid gap-3 max-w-3xl mx-auto ${
        difficulty === 'easy' ? 'grid-cols-3 md:grid-cols-4' : 
        difficulty === 'medium' ? 'grid-cols-4 md:grid-cols-4' : 
        'grid-cols-4 md:grid-cols-6'
      }`}>
        {cards.map((card) => (
          <Card 
            key={card.id} 
            className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer transition-all duration-300 ${
              card.flipped || card.matched 
                ? 'bg-white shadow-md' 
                : difficulty === 'easy' ? 'bg-green-500 hover:bg-green-400' :
                  difficulty === 'medium' ? 'bg-blue-500 hover:bg-blue-400' :
                  'bg-red-500 hover:bg-red-400'
            } ${card.matched ? 'border-2 border-green-500' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            {(card.flipped || card.matched) ? (
              <span className="text-3xl">{card.emoji}</span>
            ) : null}
          </Card>
        ))}
      </div>

      {gameWon && (
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy size={32} className="text-yellow-500" />
            <h2 className="text-2xl font-bold text-purple-800">おめでとう！</h2>
            <Trophy size={32} className="text-yellow-500" />
          </div>
          <p className="mb-2 text-gray-600">
            {moves}回の移動で全てのペアを見つけました！
          </p>
          <p className="mb-4 text-gray-600">
            タイム: {formatTime(timer)}
          </p>
          <Button 
            onClick={initializeGame}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RotateCcw className="mr-2" />
            もう一度プレイ
          </Button>
        </div>
      )}

      {!gameWon && (
        <Button 
          onClick={initializeGame}
          className="mt-8 bg-purple-600 hover:bg-purple-700"
        >
          <RotateCcw className="mr-2" />
          リセット
        </Button>
      )}
    </div>
  )
}

export default App
