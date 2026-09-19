import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { ChessBoard3D } from '../components/3d/ChessBoard3D';
import { SoundEffects } from '../utils/sound';
import { DAILY_PUZZLES, LocalStore, DailyPuzzle } from '../api/localStore';
import { CheckCircle2, Circle, RotateCcw } from 'lucide-react';

const DEFAULT_PUZZLE = DAILY_PUZZLES[0]!;

export const PuzzlesPage: React.FC = () => {
  const [activePuzzle, setActivePuzzle] = useState<DailyPuzzle>(DEFAULT_PUZZLE);
  const [chess, setChess] = useState(() => new Chess(DEFAULT_PUZZLE.fen));
  const [fen, setFen] = useState(DEFAULT_PUZZLE.fen);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [moveStep, setMoveStep] = useState(0);
  const [isSolved, setIsSolved] = useState(() => LocalStore.isPuzzleSolved(DEFAULT_PUZZLE.id));
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPuzzle = (p: DailyPuzzle) => {
    setActivePuzzle(p);
    const newChess = new Chess(p.fen);
    setChess(newChess);
    setFen(p.fen);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveStep(0);
    setIsSolved(LocalStore.isPuzzleSolved(p.id));
    setFeedback(null);
  };

  const handleSquareClick = (square: string) => {
    if (isSolved) return;

    if (selectedSquare && legalMoves.includes(square)) {
      try {
        const move = chess.move({
          from: selectedSquare as Square,
          to: square as Square,
          promotion: 'q',
        });

        if (move) {
          SoundEffects.playMove();
          setFen(chess.fen());
          setSelectedSquare(null);
          setLegalMoves([]);

          const expectedSan = activePuzzle.solutionSan[moveStep];
          if (move.san === expectedSan) {
            const nextStep = moveStep + 1;
            setMoveStep(nextStep);

            if (nextStep >= activePuzzle.solutionSan.length) {
              setIsSolved(true);
              LocalStore.markPuzzleSolved(activePuzzle.id);
              SoundEffects.playVictory();
              confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
              setFeedback('Tactical solution complete!');
            } else {
              setFeedback('Correct move! Opponent responding...');
              setTimeout(() => {
                const opponentMoveSan = activePuzzle.solutionSan[nextStep];
                if (opponentMoveSan) {
                  chess.move(opponentMoveSan);
                  setFen(chess.fen());
                  SoundEffects.playMove();
                  setMoveStep(nextStep + 1);
                  setFeedback('Your turn: deliver the decisive move!');
                }
              }, 600);
            }
          } else {
            setFeedback('Incorrect move. Resetting...');
            SoundEffects.playCheck();
            setTimeout(() => {
              const resetChess = new Chess(activePuzzle.fen);
              setChess(resetChess);
              setFen(activePuzzle.fen);
              setMoveStep(0);
              setFeedback(null);
            }, 1000);
          }
        }
      } catch {}
      return;
    }

    const piece = chess.get(square as Square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as Square, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)',
        color: '#ffffff',
        display: 'flex',
        padding: '32px 40px',
        gap: '32px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* 3D Board Area */}
      <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: '560px',
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.04) 0%, #050507 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 255, 255, 0.04)',
          }}
        >
          <ChessBoard3D
            fen={fen}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            checkSquare={null}
            lastMove={null}
            playerColor={activePuzzle.playerColor}
            theme="default"
            onSquareClick={handleSquareClick}
          />
        </div>
      </div>

      {/* Side Puzzle Info & Selector */}
      <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Active Puzzle Card */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '22px',
            padding: '28px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '4px 12px',
                borderRadius: '8px',
              }}
            >
              ⭐ {activePuzzle.rating} Elo
            </span>
            <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{activePuzzle.theme}</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>{activePuzzle.title}</h2>
          <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 22px 0' }}>
            {activePuzzle.description}
          </p>

          {feedback && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: isSolved ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                border: isSolved ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              {feedback}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => loadPuzzle(activePuzzle)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={15} />
              Reset Puzzle
            </button>
          </div>
        </div>

        {/* Puzzle List */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '22px',
            padding: '24px',
            flex: 1,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Tactical Library</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DAILY_PUZZLES.map((p) => {
              const solved = LocalStore.isPuzzleSolved(p.id);
              const isCurrent = p.id === activePuzzle.id;
              return (
                <div
                  key={p.id}
                  onClick={() => loadPuzzle(p)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: isCurrent ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isCurrent ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {solved ? <CheckCircle2 size={18} color="#ffffff" /> : <Circle size={18} color="#52525b" />}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>{p.theme}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{p.rating}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
