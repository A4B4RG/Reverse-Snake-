from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.core.window import Window
from torch import layout


class OptionsScreen(Screen):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.sound_on = True

        layout = BoxLayout(
            orientation="vertical",
            spacing=20,
            padding=40
        )

        title = Label(
            text="Options",
            font_size=40,
            size_hint=(1, 0.3)
        )

        self.sound_button = Button(
            text="Sound: ON",
            size_hint=(1, 0.2)
        )

        bio_btn = Button(
            text="App Bio",
            size_hint=(1, 0.2)
        )
        fullscreen_btn = Button(
        text="Toggle Fullscreen",
        size_hint=(1, 0.2)
        )

        back_btn = Button(
            text="Back",
            size_hint=(1, 0.2)
        )

        self.sound_button.bind(on_press=self.toggle_sound)
        bio_btn.bind(on_press=self.show_bio)
        fullscreen_btn.bind(on_press=self.toggle_fullscreen)
        back_btn.bind(on_press=self.go_back)

        layout.add_widget(title)
        layout.add_widget(self.sound_button)
        layout.add_widget(bio_btn)
        layout.add_widget(fullscreen_btn)
        layout.add_widget(back_btn)

        self.add_widget(layout)

    def toggle_sound(self, instance):

        self.sound_on = not self.sound_on

        if self.sound_on:
            self.sound_button.text = "Sound: ON"
        else:
            self.sound_button.text = "Sound: OFF"

    def show_bio(self, instance):

        print("Reverse Snake: You play as the food and must outsmart the snake!")

    def toggle_fullscreen(self, instance):

        if Window.borderless:
            Window.borderless = False
            Window.size = (900, 900)   # window size when not fullscreen
        else:
            Window.borderless = True
            Window.size = Window.system_size

    def go_back(self, instance):

        self.manager.current = "home"