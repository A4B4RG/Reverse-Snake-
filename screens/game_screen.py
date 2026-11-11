# reverse_snake/screens/game_screen.py

from kivy.uix.screenmanager import Screen
from kivy.core.window import Window
from kivy.graphics import Color, Rectangle
from kivy.clock import Clock

GRID_SIZE = 20


def get_cell_size():
    """Compute cell size at runtime so Window is fully initialized."""
    return min(Window.width, Window.height) // GRID_SIZE


class GameScreen(Screen):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self._keyboard_bound = False

        # Game state flag
        self.game_over = False

        # Player starting position (center of grid)
        self.player_x = 5
        self.player_y = 10

        # Player movement direction — starts stationary
        self.dx = 0
        self.dy = 0

        # Snake body: list of (x, y) segments, head is index 0
        self.snake = [(15, 10), (14, 10), (13, 10), (12, 10)]

        # Snake movement direction
        self.snake_dx = -1
        self.snake_dy = 0

        # Game loop: 10 ticks per second
        self._update_event = Clock.schedule_interval(self.update, 1 / 10)

    # ── Screen lifecycle ──────────────────────────────────────────────────────

    def on_enter(self):
        """Called every time this screen becomes active."""
        if not self._keyboard_bound:
            Window.bind(on_key_down=self.on_key_down)
            self._keyboard_bound = True
        self.draw()

    def on_leave(self):
        """Called when leaving this screen (e.g. going to pause)."""
        Window.unbind(on_key_down=self.on_key_down)
        self._keyboard_bound = False

    # ── Drawing ───────────────────────────────────────────────────────────────

    def draw(self):
        cell = get_cell_size()
        self.canvas.clear()

        with self.canvas:

            # Grid background
            Color(0.1, 0.1, 0.1)
            for x in range(GRID_SIZE):
                for y in range(GRID_SIZE):
                    Rectangle(
                        pos=(x * cell, y * cell),
                        size=(cell - 1, cell - 1)
                    )

            # Snake body (green)
            Color(0, 0.8, 0)
            for segment in self.snake:
                Rectangle(
                    pos=(segment[0] * cell, segment[1] * cell),
                    size=(cell, cell)
                )

            # Snake head (darker green so it's distinct)
            Color(0, 0.5, 0)
            head = self.snake[0]
            Rectangle(
                pos=(head[0] * cell, head[1] * cell),
                size=(cell, cell)
            )

            # Player (red square = the food)
            Color(1, 0, 0)
            Rectangle(
                pos=(self.player_x * cell, self.player_y * cell),
                size=(cell, cell)
            )

            # Game over overlay
            if self.game_over:
                Color(0.8, 0, 0, 0.4)
                Rectangle(pos=(0, 0), size=(Window.width, Window.height))

    # ── Game loop ─────────────────────────────────────────────────────────────

    def update(self, dt):
        if self.game_over:
            return

        # 1. Move player
        new_px = self.player_x + self.dx
        new_py = self.player_y + self.dy

        # Clamp player to grid walls
        new_px = max(0, min(GRID_SIZE - 1, new_px))
        new_py = max(0, min(GRID_SIZE - 1, new_py))

        self.player_x = new_px
        self.player_y = new_py

        # 2. Snake AI: chase player (simple axis-aligned, one axis per tick)
        head_x, head_y = self.snake[0]

        if head_x < self.player_x:
            self.snake_dx, self.snake_dy = 1, 0
        elif head_x > self.player_x:
            self.snake_dx, self.snake_dy = -1, 0
        elif head_y < self.player_y:
            self.snake_dx, self.snake_dy = 0, 1
        elif head_y > self.player_y:
            self.snake_dx, self.snake_dy = 0, -1

        # 3. Move snake head
        new_head = (head_x + self.snake_dx, head_y + self.snake_dy)

        # 4. Check: snake hits wall
        if not (0 <= new_head[0] < GRID_SIZE and 0 <= new_head[1] < GRID_SIZE):
            self._trigger_win()
            return

        # 5. Check: snake hits its own body (skip head, check segments 1+)
        if new_head in self.snake[1:]:
            self._trigger_win()
            return

        # 6. Commit snake move (no food in this mode, so always pop tail)
        self.snake.insert(0, new_head)
        self.snake.pop()

        # 7. Check: snake catches player
        if self.snake[0] == (self.player_x, self.player_y):
            self._trigger_game_over()
            return

        # 8. Redraw — only once per tick
        self.draw()

    # ── Win / loss ────────────────────────────────────────────────────────────

    def _trigger_win(self):
        """Snake crashed — player wins."""
        self.game_over = True
        self.draw()
        # TODO: show win screen / score (Phase 1 polish pass)
        Clock.schedule_once(lambda dt: self._reset(), 2)

    def _trigger_game_over(self):
        """Snake caught the player."""
        self.game_over = True
        self.draw()
        # TODO: show loss screen / score (Phase 1 polish pass)
        Clock.schedule_once(lambda dt: self._reset(), 2)

    def _reset(self):
        """Reset game state for a new round."""
        self.game_over = False
        self.player_x = 5
        self.player_y = 10
        self.dx = 0
        self.dy = 0
        self.snake = [(15, 10), (14, 10), (13, 10), (12, 10)]
        self.snake_dx = -1
        self.snake_dy = 0
        self.draw()

    # ── Input ─────────────────────────────────────────────────────────────────

    def on_key_down(self, window, key, scancode, codepoint, modifiers):
        if key == 119:   # W — up
            self.dx, self.dy = 0, 1
        elif key == 115: # S — down
            self.dx, self.dy = 0, -1
        elif key == 97:  # A — left
            self.dx, self.dy = -1, 0
        elif key == 100: # D — right
            self.dx, self.dy = 1, 0
        elif key == 27:  # ESC — pause
            self.manager.current = "pause"