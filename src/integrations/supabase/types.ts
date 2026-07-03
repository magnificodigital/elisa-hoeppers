export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          category: string
          description: string | null
          display_order: number
          is_secret: boolean
          key: string
          label: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          category?: string
          description?: string | null
          display_order?: number
          is_secret?: boolean
          key: string
          label?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          display_order?: number
          is_secret?: boolean
          key?: string
          label?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          code: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          ends_at: string
          id: string
          notes: string | null
          service_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          service_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          day_of_week: number
          end_time: string | null
          is_active: boolean
          start_time: string | null
          updated_at: string
        }
        Insert: {
          day_of_week: number
          end_time?: string | null
          is_active?: boolean
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          day_of_week?: number
          end_time?: string | null
          is_active?: boolean
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bodyoga_rituals: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bodyoga_slides: {
        Row: {
          created_at: string
          cta_href: string | null
          cta_label: string | null
          display_order: number
          duration_seconds: number
          id: string
          image_url: string | null
          is_active: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          display_order?: number
          duration_seconds?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          display_order?: number
          duration_seconds?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          body_html: string
          created_at: string
          created_by: string | null
          failed_count: number | null
          id: string
          segment_id: string | null
          segment_label: string | null
          segment_type: string
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
        }
        Insert: {
          body_html: string
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          segment_id?: string | null
          segment_label?: string | null
          segment_type: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
        }
        Update: {
          body_html?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          segment_id?: string | null
          segment_label?: string | null
          segment_type?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          code: string
          course_id: string
          course_title: string
          id: string
          instructor_name: string
          issued_at: string
          student_name: string
          user_id: string
        }
        Insert: {
          code: string
          course_id: string
          course_title: string
          id?: string
          instructor_name?: string
          issued_at?: string
          student_name: string
          user_id: string
        }
        Update: {
          code?: string
          course_id?: string
          course_title?: string
          id?: string
          instructor_name?: string
          issued_at?: string
          student_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "my_course_progress"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          display_order: number
          duration_total_min: number | null
          id: string
          instructor_id: string | null
          is_published: boolean
          level: Database["public"]["Enums"]["course_level"]
          overlay_label: string | null
          price_cents: number | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_total_min?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          overlay_label?: string | null
          price_cents?: number | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_total_min?: number | null
          id?: string
          instructor_id?: string | null
          is_published?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          overlay_label?: string | null
          price_cents?: number | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          paid_cents: number | null
          payment_preference_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          paid_cents?: number | null
          payment_preference_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          paid_cents?: number | null
          payment_preference_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "my_course_progress"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_answers: {
        Row: {
          author_name: string | null
          author_role: Database["public"]["Enums"]["user_role"] | null
          body: string
          created_at: string
          id: string
          question_id: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          author_role?: Database["public"]["Enums"]["user_role"] | null
          body: string
          created_at?: string
          id?: string
          question_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          author_role?: Database["public"]["Enums"]["user_role"] | null
          body?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          last_seen_at: string
          lesson_id: string
          user_id: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          last_seen_at?: string
          lesson_id: string
          user_id: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          last_seen_at?: string
          lesson_id?: string
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          author_name: string | null
          body: string
          created_at: string
          id: string
          is_resolved: boolean
          lesson_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          lesson_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          lesson_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_md: string | null
          course_id: string
          created_at: string
          description: string | null
          display_order: number
          duration_min: number | null
          id: string
          is_free_preview: boolean
          module_id: string | null
          slug: string
          title: string
          updated_at: string
          youtube_id: string | null
        }
        Insert: {
          content_md?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_min?: number | null
          id?: string
          is_free_preview?: boolean
          module_id?: string | null
          slug: string
          title: string
          updated_at?: string
          youtube_id?: string | null
        }
        Update: {
          content_md?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_min?: number | null
          id?: string
          is_free_preview?: boolean
          module_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "my_course_progress"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          display_order: number
          id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          display_order?: number
          id?: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          display_order?: number
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "my_course_progress"
            referencedColumns: ["course_id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          full_name: string | null
          id: string
          resend_contact_id: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          full_name?: string | null
          id?: string
          resend_contact_id?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          id?: string
          resend_contact_id?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          code: string
          created_at: string
          customer_address: Json | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          me_label_url: string | null
          me_order_id: string | null
          me_status: string | null
          notes: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payment_preference_id: string | null
          shipping_cents: number
          shipping_destination_cep: string | null
          shipping_service_id: string | null
          shipping_service_label: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          customer_address?: Json | null
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          items: Json
          me_label_url?: string | null
          me_order_id?: string | null
          me_status?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_preference_id?: string | null
          shipping_cents?: number
          shipping_destination_cep?: string | null
          shipping_service_id?: string | null
          shipping_service_label?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          customer_address?: Json | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          me_label_url?: string | null
          me_order_id?: string | null
          me_status?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_preference_id?: string | null
          shipping_cents?: number
          shipping_destination_cep?: string | null
          shipping_service_id?: string | null
          shipping_service_label?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_name: string | null
          body_md: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body_md?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body_md?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          compare_at_price_cents: number | null
          created_at: string
          description: string | null
          display_order: number
          gallery: Json
          height_cm: number | null
          id: string
          in_stock: boolean
          is_active: boolean
          is_featured: boolean
          length_cm: number | null
          name: string
          price_cents: number
          ritual_id: string | null
          short_description: string | null
          slug: string
          updated_at: string
          weight_g: number | null
          width_cm: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          gallery?: Json
          height_cm?: number | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          is_featured?: boolean
          length_cm?: number | null
          name: string
          price_cents: number
          ritual_id?: string | null
          short_description?: string | null
          slug: string
          updated_at?: string
          weight_g?: number | null
          width_cm?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          gallery?: Json
          height_cm?: number | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          is_featured?: boolean
          length_cm?: number | null
          name?: string
          price_cents?: number
          ritual_id?: string | null
          short_description?: string | null
          slug?: string
          updated_at?: string
          weight_g?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "bodyoga_rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          correct_count: number
          id: string
          passed: boolean
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          attempted_at?: string
          correct_count: number
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          correct_count?: number
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          display_order: number
          explanation: string | null
          id: string
          options: Json | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          quiz_id: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          display_order?: number
          explanation?: string | null
          id?: string
          options?: Json | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          display_order?: number
          explanation?: string | null
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          lesson_id: string
          max_attempts: number | null
          passing_score: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          lesson_id: string
          max_attempts?: number | null
          passing_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          lesson_id?: string
          max_attempts?: number | null
          passing_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          display_order: number
          duration_min: number
          id: string
          is_active: boolean
          is_group: boolean
          is_online: boolean
          price_cents: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          is_group?: boolean
          is_online?: boolean
          price_cents: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_min?: number
          id?: string
          is_active?: boolean
          is_group?: boolean
          is_online?: boolean
          price_cents?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          added_at: string
          course_id: string | null
          id: string
          item_type: Database["public"]["Enums"]["wishlist_item_type"]
          product_id: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          course_id?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["wishlist_item_type"]
          product_id?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          course_id?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["wishlist_item_type"]
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "my_course_progress"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_course_progress: {
        Row: {
          completed_lessons: number | null
          course_id: string | null
          course_slug: string | null
          course_title: string | null
          cover_image: string | null
          enrolled_at: string | null
          next_lesson_id: string | null
          overlay_label: string | null
          total_lessons: number | null
        }
        Relationships: []
      }
      quiz_questions_public: {
        Row: {
          display_order: number | null
          id: string | null
          options: Json | null
          question_text: string | null
          question_type: Database["public"]["Enums"]["question_type"] | null
          quiz_id: string | null
        }
        Insert: {
          display_order?: number | null
          id?: string | null
          options?: Json | null
          question_text?: string | null
          question_type?: Database["public"]["Enums"]["question_type"] | null
          quiz_id?: string | null
        }
        Update: {
          display_order?: number | null
          id?: string | null
          options?: Json | null
          question_text?: string | null
          question_type?: Database["public"]["Enums"]["question_type"] | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      taken_slots: {
        Row: {
          ends_at: string | null
          service_id: string | null
          starts_at: string | null
        }
        Insert: {
          ends_at?: string | null
          service_id?: string | null
          starts_at?: string | null
        }
        Update: {
          ends_at?: string | null
          service_id?: string | null
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_count_broadcast_recipients: {
        Args: { p_segment_id?: string; p_segment_type: string }
        Returns: number
      }
      admin_dashboard_stats: { Args: never; Returns: Json }
      admin_global_search: { Args: { p_query: string }; Returns: Json }
      admin_list_customers: { Args: never; Returns: Json }
      book_appointment: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone?: string
          p_notes?: string
          p_service_id: string
          p_starts_at: string
        }
        Returns: {
          appointment_id: string
          code: string
          ends_at: string
          starts_at: string
        }[]
      }
      claim_guest_orders: { Args: never; Returns: number }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      gen_appointment_code: { Args: never; Returns: string }
      gen_certificate_code: { Args: never; Returns: string }
      gen_order_code: { Args: never; Returns: string }
      get_order_by_code: {
        Args: { p_code: string }
        Returns: {
          code: string
          created_at: string
          customer_name: string
          id: string
          items: Json
          shipping_cents: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_code: string
          user_id: string
        }[]
      }
      get_public_setting: { Args: { p_key: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_enrolled: { Args: { p_course_id: string }; Returns: boolean }
      is_enrolled_in_lesson: { Args: { p_lesson_id: string }; Returns: boolean }
      issue_certificate: {
        Args: { p_course_id: string }
        Returns: {
          already_issued: boolean
          certificate_id: string
          code: string
          course_title: string
          issued_at: string
          student_name: string
        }[]
      }
      mark_lesson_complete: {
        Args: { p_lesson_id: string; p_watched_seconds?: number }
        Returns: undefined
      }
      place_order: {
        Args: {
          p_customer_address?: Json
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_destination_cep?: string
          p_items: Json
          p_notes?: string
          p_shipping_cents?: number
          p_shipping_service_id?: string
          p_shipping_service_label?: string
        }
        Returns: {
          code: string
          order_id: string
          subtotal_cents: number
          total_cents: number
        }[]
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_quiz_id: string }
        Returns: {
          attempt_id: string
          correct_count: number
          passed: boolean
          results: Json
          score: number
          total_questions: number
        }[]
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      course_level: "iniciante" | "intermediario" | "avancado" | "todos"
      enrollment_status: "active" | "cancelled" | "completed"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "cancelled"
        | "completed"
      question_type: "multiple_choice" | "true_false"
      user_role: "student" | "instructor" | "admin"
      wishlist_item_type: "course" | "product"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      course_level: ["iniciante", "intermediario", "avancado", "todos"],
      enrollment_status: ["active", "cancelled", "completed"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "cancelled",
        "completed",
      ],
      question_type: ["multiple_choice", "true_false"],
      user_role: ["student", "instructor", "admin"],
      wishlist_item_type: ["course", "product"],
    },
  },
} as const
