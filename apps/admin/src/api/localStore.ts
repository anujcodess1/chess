/**
 * Browser-only persistent store for Grand Chess.
 * Handles accounts, profiles, ratings, game history and puzzle state via localStorage.
 */

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  title?: string;
  ratings: {
    bullet: number;
    blitz: number;
    rapid: number;
    classical: number;
  };
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
  };
  createdAt: string;
}

export interface GameHistoryItem {
  id: string;
  date: string;
  opponent: string;
  opponentRating: number;
  playerColor: 'white' | 'black';
  result: 'win' | 'loss' | 'draw';
  reason: string;
  timeControl: string;
  movesCount: number;
  pgn: string;
  ratingChange: number;
}

export interface DailyPuzzle {
  id: string;
  title: string;
  rating: number;
  fen: string;
  playerColor: 'white' | 'black';
  solutionSan: string[];
  theme: string;
  description: string;
}

const USERS_STORAGE_KEY = 'grand_chess_users';
const CURRENT_USER_KEY = 'grand_chess_current_user';
const GAME_HISTORY_KEY = 'grand_chess_history';
const SOLVED_PUZZLES_KEY = 'grand_chess_solved_puzzles';
const DATA_VERSION_KEY = 'grand_chess_data_version';
const DATA_VERSION = '2';

// One-time purge: wipe any previously stored accounts, sessions and demo data.
(function purgeStoredData() {
  try {
    if (localStorage.getItem(DATA_VERSION_KEY) === DATA_VERSION) return;
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(GAME_HISTORY_KEY);
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('grand_chess_player_session');
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  } catch {
    /* localStorage unavailable */
  }
})();

export const DAILY_PUZZLES: DailyPuzzle[] = [
  {
    id: 'puzzle-1',
    title: 'Queen Sacrifice Smothered Mate',
    rating: 1850,
    fen: 'r1b2r1k/pp3Npp/2n5/2p5/2B5/8/PPP2PPP/R1B1R1K1 b - - 0 1',
    playerColor: 'black',
    solutionSan: ['Rxf7', 'Re8#'],
    theme: 'Back-Rank & Pin',
    description: 'Black king is trapped. Find the decisive combination.',
  },
  {
    id: 'puzzle-2',
    title: 'Knight Fork on King and Queen',
    rating: 1420,
    fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1b2n3/2NP1N2/PPP1BPPP/R1BQK2R w KQkq - 0 6',
    playerColor: 'white',
    solutionSan: ['dxe4', 'Bxc3+'],
    theme: 'Tactical Exchange',
    description: 'Calculate the pawn capture and defense.',
  },
  {
    id: 'puzzle-3',
    title: 'Greek Gift Sacrifice',
    rating: 2100,
    fen: 'r1bq1rk1/pp1n1ppp/4p3/3pP3/3P4/3B1N2/PP1Q1PPP/R3K2R w KQ - 0 12',
    playerColor: 'white',
    solutionSan: ['Bxh7+', 'Kxh7', 'Ng5+'],
    theme: 'Attacking King',
    description: 'Shatter the kingside pawn shield with a bishop sacrifice.',
  },
];

function getStoredUsers(): Record<string, { user: UserAccount; passwordHash: string }> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { user: UserAccount; passwordHash: string }>): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const LocalStore = {
  getCurrentUser(): UserAccount | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem('auth_access_token', `local_token_${user.id}_${Date.now()}`);
      localStorage.setItem('auth_refresh_token', `local_refresh_${user.id}_${Date.now()}`);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
    }
  },

  signUp(username: string, email: string, password: string, displayName?: string): { success: boolean; user?: UserAccount; error?: string } {
    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUser || cleanUser.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = getStoredUsers();
    const userKey = cleanUser.toLowerCase();

    if (users[userKey]) {
      return { success: false, error: 'Username is already taken.' };
    }

    const emailExists = Object.values(users).some(entry => entry.user.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return { success: false, error: 'Email is already registered.' };
    }

    const newUser: UserAccount = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: cleanUser,
      email: cleanEmail,
      displayName: displayName?.trim() || cleanUser,
      ratings: {
        bullet: 1200,
        blitz: 1200,
        rapid: 1200,
        classical: 1200,
      },
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
      createdAt: new Date().toISOString(),
    };

    users[userKey] = { user: newUser, passwordHash: password };
    saveUsers(users);
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  signIn(usernameOrEmail: string, password: string): { success: boolean; user?: UserAccount; error?: string } {
    const query = usernameOrEmail.trim().toLowerCase();
    if (!query) return { success: false, error: 'Username or email required.' };
    if (!password) return { success: false, error: 'Password required.' };

    const users = getStoredUsers();
    const match = Object.values(users).find(
      entry => entry.user.username.toLowerCase() === query || entry.user.email.toLowerCase() === query
    );

    if (!match) {
      return { success: false, error: 'Account not found. Please sign up.' };
    }

    if (match.passwordHash !== password) {
      return { success: false, error: 'Invalid password. Try again.' };
    }

    this.setCurrentUser(match.user);
    return { success: true, user: match.user };
  },

  signOut(): void {
    this.setCurrentUser(null);
  },

  recordGame(historyItem: Omit<GameHistoryItem, 'id' | 'date'>): GameHistoryItem {
    const item: GameHistoryItem = {
      ...historyItem,
      id: `game_${Date.now()}`,
      date: new Date().toISOString(),
    };

    try {
      const existing = this.getGameHistory();
      const updated = [item, ...existing].slice(0, 50);
      localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(updated));

      // Update current user stats
      const user = this.getCurrentUser();
      if (user) {
        user.stats.gamesPlayed += 1;
        if (item.result === 'win') user.stats.wins += 1;
        else if (item.result === 'loss') user.stats.losses += 1;
        else user.stats.draws += 1;

        // Apply rating change
        const cat = item.timeControl.toLowerCase() as keyof UserAccount['ratings'];
        if (user.ratings[cat] !== undefined) {
          user.ratings[cat] = Math.max(100, user.ratings[cat] + item.ratingChange);
        } else {
          user.ratings.rapid = Math.max(100, user.ratings.rapid + item.ratingChange);
        }

        this.setCurrentUser(user);
        const users = getStoredUsers();
        const entry = users[user.username.toLowerCase()];
        if (entry) {
          entry.user = user;
          saveUsers(users);
        }
      }
    } catch (e) {
      console.error('Failed to save game history:', e);
    }

    return item;
  },

  getGameHistory(): GameHistoryItem[] {
    try {
      const raw = localStorage.getItem(GAME_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getLeaderboard(): UserAccount[] {
    const users = getStoredUsers();
    return Object.values(users)
      .map(entry => entry.user)
      .sort((a, b) => b.ratings.blitz - a.ratings.blitz);
  },

  isPuzzleSolved(puzzleId: string): boolean {
    try {
      const raw = localStorage.getItem(SOLVED_PUZZLES_KEY);
      const solved: string[] = raw ? JSON.parse(raw) : [];
      return solved.includes(puzzleId);
    } catch {
      return false;
    }
  },

  markPuzzleSolved(puzzleId: string): void {
    try {
      const raw = localStorage.getItem(SOLVED_PUZZLES_KEY);
      const solved: string[] = raw ? JSON.parse(raw) : [];
      if (!solved.includes(puzzleId)) {
        solved.push(puzzleId);
        localStorage.setItem(SOLVED_PUZZLES_KEY, JSON.stringify(solved));
      }
    } catch (e) {
      console.error(e);
    }
  },
};
