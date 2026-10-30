package com.gymsaas.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Transfer / DeUna receipt uploaded by the owner. Stored in the DB so it survives redeploys. */
@Entity
@Table(name = "payment_receipts")
public class PaymentReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String contentType;

    private String filename;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(nullable = false, columnDefinition = "bytea") // valid in PostgreSQL and H2
    private byte[] data;

    public Long getId() { return id; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }
}
