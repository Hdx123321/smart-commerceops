package com.smartcommerce.identity.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_accounts")
public class UserAccount {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 80)
  private String username;

  @Column(nullable = false, unique = true, length = 160)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private Role role = Role.CUSTOMER;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column(length = 30)
  private String gender;

  private Integer heightCm;

  private Integer weightKg;

  @Column(precision = 4, scale = 1)
  private java.math.BigDecimal shoeSize;

  @Column(length = 500)
  private String shippingAddress;

  @Column(length = 40)
  private String phoneNumber;

  @Column(length = 120)
  private String paymentMethod;

  protected UserAccount() {
  }

  public UserAccount(String username, String email, String passwordHash, Role role) {
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
  }

  public Long getId() { return id; }
  public String getUsername() { return username; }
  public String getEmail() { return email; }
  public String getPasswordHash() { return passwordHash; }
  public Role getRole() { return role; }
  public Instant getCreatedAt() { return createdAt; }
  public String getGender() { return gender; }
  public Integer getHeightCm() { return heightCm; }
  public Integer getWeightKg() { return weightKg; }
  public java.math.BigDecimal getShoeSize() { return shoeSize; }
  public String getShippingAddress() { return shippingAddress; }
  public String getPhoneNumber() { return phoneNumber; }
  public String getPaymentMethod() { return paymentMethod; }

  public void updateProfile(String username, String gender, Integer heightCm, Integer weightKg,
                            java.math.BigDecimal shoeSize, String shippingAddress, String phoneNumber,
                            String paymentMethod) {
    this.username = username;
    this.gender = gender;
    this.heightCm = heightCm;
    this.weightKg = weightKg;
    this.shoeSize = shoeSize;
    this.shippingAddress = shippingAddress;
    this.phoneNumber = phoneNumber;
    this.paymentMethod = paymentMethod;
  }
}
