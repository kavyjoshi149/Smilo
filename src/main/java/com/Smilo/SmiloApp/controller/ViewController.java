package com.Smilo.SmiloApp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping({"/", "/index.html"})
    public String index() { return "index"; }

    @GetMapping("/login.html")
    public String login() { return "login"; }

    @GetMapping("/signup.html")
    public String signup() { return "signup"; }

    @GetMapping("/onboarding.html")
    public String onboarding() { return "onboarding"; }

    @GetMapping("/home.html")
    public String home() { return "home"; }

    @GetMapping("/dashboard.html")
    public String dashboard() { return "dashboard"; }

    @GetMapping("/friends.html")
    public String friends() { return "friends"; }

    @GetMapping("/discover.html")
    public String discover() { return "discover"; }

    @GetMapping("/leaderboard.html")
    public String leaderboard() { return "leaderboard"; }

    @GetMapping("/thoughts.html")
    public String thoughts() { return "thoughts"; }

    @GetMapping("/chat.html")
    public String chat() { return "chat"; }

    @GetMapping("/settings.html")
    public String settings() { return "settings"; }
}