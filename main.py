# reverse_snake/main.py

from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, FadeTransition

# Import screens
from screens.home_screen import HomeScreen
from screens.game_screen import GameScreen
from screens.options_screen import OptionsScreen
from screens.pause_screen import PauseScreen


class ReverseSnakeApp(App):

    def build(self):

        # Screen manager controls switching between screens
        sm = ScreenManager(transition=FadeTransition())

        # Add screens
        sm.add_widget(HomeScreen(name="home"))
        sm.add_widget(GameScreen(name="game"))
        sm.add_widget(OptionsScreen(name="options"))
        sm.add_widget(PauseScreen(name="pause"))

        # Default screen
        sm.current = "home"

        return sm


if __name__ == "__main__":
    ReverseSnakeApp().run()