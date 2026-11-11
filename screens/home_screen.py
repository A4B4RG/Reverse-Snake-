from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.app import App


class HomeScreen(Screen):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        layout = BoxLayout(
            orientation="vertical",
            spacing=20,
            padding=40
        )

        title = Label(
            text="Reverse Snake",
            font_size=40,
            size_hint=(1, 0.3)
        )

        new_game_btn = Button(
            text="New Game",
            size_hint=(1, 0.15)
        )

        continue_btn = Button(
            text="Continue",
            size_hint=(1, 0.15)
        )

        options_btn = Button(
            text="Options",
            size_hint=(1, 0.15)
        )

        exit_btn = Button(
            text="Exit",
            size_hint=(1, 0.15)
        )

        # Button actions
        new_game_btn.bind(on_press=self.start_game)
        continue_btn.bind(on_press=self.continue_game)
        options_btn.bind(on_press=self.open_options)
        exit_btn.bind(on_press=self.exit_game)

        layout.add_widget(title)
        layout.add_widget(new_game_btn)
        layout.add_widget(continue_btn)
        layout.add_widget(options_btn)
        layout.add_widget(exit_btn)

        self.add_widget(layout)

    def start_game(self, instance):
        self.manager.current = "game"

    def continue_game(self, instance):
        self.manager.current = "game"

    def open_options(self, instance):
        self.manager.current = "options"

    def exit_game(self, instance):
        App.get_running_app().stop()