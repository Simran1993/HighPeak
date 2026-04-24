package com.travelit.backend.invite;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InviteMailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendInviteEmail(String toEmail, String tripTitle, String inviterName, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(inviterName + " invited you to join \"" + tripTitle + "\"");
        message.setText(
                "Hi,\n\n" +
                inviterName + " has invited you to collaborate on the trip \"" + tripTitle + "\".\n\n" +
                "Accept the invitation here:\n" +
                frontendUrl + "/invites/accept?token=" + token + "\n\n" +
                "This link expires in 7 days.\n\n" +
                "If you don't have an account yet, you'll be asked to register first — " +
                "your invite will be applied automatically."
        );
        mailSender.send(message);
    }
}
