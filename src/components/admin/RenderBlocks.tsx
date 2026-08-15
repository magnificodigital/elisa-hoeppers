import React, { useEffect, useState, useMemo } from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import { BodyogaProductCard } from "../bodyoga/BodyogaLanding";
import HomeInstagram from "../home/HomeInstagram";
import HomeBlog from "../home/HomeBlog";
import { listActiveSlides, listProducts, formatPriceBRL } from "@/lib/shop";
import { listPublishedCourses } from "@/lib/courses";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Leaf, 
  Heart, 
  Sparkles, 
  Flower2, 
  Sprout, 
  Clock, 
  Layout, 
  Star,
  CheckCircle2,
  ArrowRight,
  Globe,
  Calendar,
  GraduationCap,
  Dumbbell,
  ShoppingBag,
  Instagram,
  Youtube,
  MessageCircle,
  Video,
  Users,
  User as UserIcon,
  MapPin,
  ChevronRight,
  Check
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import iconAsset from "@/assets/bodyoga/icone-bodyoga-2.png.asset.json";
import { CustomProjectForm } from "@/components/projetos/CustomProjectForm";
import { useAuth } from "@/hooks/useAuth";
import {
  listServices, listTakenSlots, bookAppointment, generateSlotsForDate,
  listAvailabilityRules, listAvailabilityBlocks,
  formatCurrencyBRL, formatTime, formatDate,
  type Service,
} from "@/lib/appointments";

