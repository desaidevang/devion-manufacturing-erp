package com.devion.erp.seeder;

import com.devion.erp.entity.ProductStandard;
import com.devion.erp.repository.PSIRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class PSIDataSeeder implements CommandLineRunner {

    @Autowired
    private PSIRepository psiRepository;

    @Override
    public void run(String... args) {
        // Only seed if database is empty
        if (psiRepository.count() == 0) {
            seedDefaultPSI();
        }
    }

    private void seedDefaultPSI() {
        // Create default PSI records based on your document
        List<ProductStandard> defaultPSI = Arrays.asList(
                createPSI("PSI-001", "CLAMP RH Dimensional Inspection",
                        "Dimensional checks for CLAMP RH part",
                        ProductStandard.StandardType.DIMENSIONAL,
                        getInspectionItemsJson("dimensional")),

                createPSI("PSI-002", "CLAMP RH Visual Inspection",
                        "Visual appearance and surface quality checks",
                        ProductStandard.StandardType.VISUAL,
                        getInspectionItemsJson("visual")),

                createPSI("PSI-003", "CLAMP RH Material Standards",
                        "Material composition and certification checks",
                        ProductStandard.StandardType.MATERIAL,
                        getInspectionItemsJson("material")),

                createPSI("PSI-004", "CLAMP RH Performance Test",
                        "Performance and durability tests",
                        ProductStandard.StandardType.PERFORMANCE,
                        getInspectionItemsJson("performance")),

                createPSI("PSI-005", "General Assembly Standards",
                        "General assembly and packaging standards",
                        ProductStandard.StandardType.GENERAL,
                        getInspectionItemsJson("general"))
        );

        psiRepository.saveAll(defaultPSI);
        System.out.println("✅ Default PSI records seeded successfully!");
    }

    private ProductStandard createPSI(String code, String name, String desc,
                                      ProductStandard.StandardType type, String items) {
        ProductStandard psi = new ProductStandard();
        psi.setStandardCode(code);
        psi.setStandardName(name);
        psi.setDescription(desc);
        psi.setStandardType(type);
        psi.setInspectionItems(items);
        psi.setCreatedBy("SYSTEM");
        psi.setIsActive(true);
        return psi;
    }

    private String getInspectionItemsJson(String type) {
        switch (type.toLowerCase()) {
            case "dimensional":
                return "[" +
                        "{\"item\": \"Inner Diameter\", \"spec\": \"Ø6.20(+0.20/-0)\", \"tool\": \"Pin Gauge\"}," +
                        "{\"item\": \"Dimension\", \"spec\": \"5.40(+0/-0.20)\", \"tool\": \"Vernier\"}," +
                        "{\"item\": \"Flatness\", \"spec\": \"0.20 MAX\", \"tool\": \"Height Gauge\"}" +
                        "]";
            case "visual":
                return "[" +
                        "{\"item\": \"Burn/Dent/Rust\", \"spec\": \"Should Not Exist\", \"tool\": \"Visual\"}," +
                        "{\"item\": \"Plating Peel Off\", \"spec\": \"No Peeling\", \"tool\": \"Visual\"}," +
                        "{\"item\": \"Sharp Edges\", \"spec\": \"Blunt Off\", \"tool\": \"Visual\"}" +
                        "]";
            case "material":
                return "[" +
                        "{\"item\": \"Material Grade\", \"spec\": \"CRC-EDD\", \"tool\": \"Supplier Report\"}," +
                        "{\"item\": \"Certification\", \"spec\": \"As per drawing\", \"tool\": \"Lab Report\"}" +
                        "]";
            case "performance":
                return "[" +
                        "{\"item\": \"Plating Thickness\", \"spec\": \"13μ MIN\", \"tool\": \"Plating Thickness Tester\"}," +
                        "{\"item\": \"Salt Spray Test\", \"spec\": \"72-216 Hrs\", \"tool\": \"Salt Spray Chamber\"}" +
                        "]";
            default:
                return "[" +
                        "{\"item\": \"Layout Inspection\", \"spec\": \"As per drawing\", \"tool\": \"Layout Equipment\"}" +
                        "]";
        }
    }
}
