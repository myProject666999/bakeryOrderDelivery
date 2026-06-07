package com.bakery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BakeryOrderDeliveryApplication {
    public static void main(String[] args) {
        SpringApplication.run(BakeryOrderDeliveryApplication.class, args);
    }
}
