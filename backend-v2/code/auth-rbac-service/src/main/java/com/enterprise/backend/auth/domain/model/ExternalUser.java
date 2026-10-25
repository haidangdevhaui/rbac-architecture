package com.enterprise.backend.auth.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "external_users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_provider_external_id", columnNames = {"provider", "external_user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class ExternalUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internal_user_id", nullable = false)
    private InternalUser internalUser;

    @Column(nullable = false, length = 50)
    private String provider; // e.g. KEYCLOAK, AZURE_AD, OKTA

    @Column(name = "external_user_id", nullable = false, length = 255)
    private String externalUserId; // sub claim from IdP

    @Column(name = "external_username", length = 100)
    private String externalUsername;

    @Column(name = "external_email", length = 255)
    private String externalEmail;

    @Column(name = "idp_metadata", columnDefinition = "TEXT")
    private String idpMetadata;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public void updateLoginTimestamp(String metadata) {
        this.lastLoginAt = OffsetDateTime.now();
        if (metadata != null) {
            this.idpMetadata = metadata;
        }
    }
}
