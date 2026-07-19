-- 008_add_contact_to_guides.sql
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='contact_number') THEN
        ALTER TABLE guide_profiles ADD COLUMN contact_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='profile_image_url') THEN
        ALTER TABLE guide_profiles ADD COLUMN profile_image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='specialization') THEN
        ALTER TABLE guide_profiles ADD COLUMN specialization VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='experience_years') THEN
        ALTER TABLE guide_profiles ADD COLUMN experience_years INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='languages') THEN
        ALTER TABLE guide_profiles ADD COLUMN languages VARCHAR(255);
    END IF;
END $$;
