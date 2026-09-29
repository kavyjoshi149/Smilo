package com.Smilo.SmiloApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmiloAppApplication {
	public static void main(String[] args) {
		SpringApplication.run(SmiloAppApplication.class, args);
	}
}