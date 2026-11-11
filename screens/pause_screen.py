from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.app import App


class PauseScreen(Screen):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        layout = BoxLayout(
            orientation="vertical",
            spacing=20,
            padding=40
        )

        title = Label(
            text="Game Paused",
            font_size=40,
            size_hint=(1, 0.3)
        )

        continue_btn = Button(
            text="Continue",
            size_hint=(1, 0.2)
        )

        home_btn = Button(
            text="Home",
            size_hint=(1, 0.2)
        )

        exit_btn = Button(
            text="Exit Game",
            size_hint=(1, 0.2)
        )

        continue_btn.bind(on_press=self.continue_game)
        home_btn.bind(on_press=self.go_home)
        exit_btn.bind(on_press=self.exit_game)

        layout.add_widget(title)
        layout.add_widget(continue_btn)
        layout.add_widget(home_btn)
        layout.add_widget(exit_btn)

        self.add_widget(layout)

    def continue_game(self, instance):
        self.manager.current = "game"

    def go_home(self, instance):
        self.manager.current = "home"

    def exit_game(self, instance):
        App.get_running_app().stop()